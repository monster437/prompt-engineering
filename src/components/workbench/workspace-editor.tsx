"use client";

import Link from "next/link";
import React from "react";
import {
  IMAGE_ASPECT_RATIOS,
  MAX_SOURCE_PROMPT_IMAGES,
  MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES,
  type ImageAspectRatio,
  type ModelOptionDto,
  type OutputLanguage,
  type WorkspaceDto,
  type WorkspaceMode
} from "@/lib/types";
import {
  formatSourcePromptImageFileSize,
  splitImageFiles,
  toSourcePromptImage
} from "@/lib/source-prompt-images";
import {
  getAutoCameraOrientationUiHint,
  CAMERA_ORIENTATION_OPTIONS,
  DEFAULT_STYLE_TAG_ID,
  POPULAR_STYLE_TAGS,
  STYLE_TAG_GROUPS,
  formatSelectedStyleLabels,
  getSelectedCameraOrientation,
  getStyleTagLabel,
  isKnownStyleTag,
  parseSelectedStyleTags,
  updateSelectedTargetStyleTags,
  updateSelectedTargetCameraOrientation
} from "@/lib/style-tags";

type WorkspaceEditorProps = {
  workspace: WorkspaceDto;
  modelOptions: ModelOptionDto[];
  isSaving: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  onPatchWorkspace: (patch: Partial<WorkspaceDto>) => void;
  onGeneratePrompt: () => void;
  onStopGeneratePrompt: () => void;
  onRefinePrompt: () => void;
};

const modes: WorkspaceMode[] = ["interview", "optimize"];
const languages: OutputLanguage[] = ["zh", "en"];

function toModelSelectValue(configId: string, modelName: string) {
  return `${configId}::${modelName}`;
}

function dedupeModelOptions(options: ModelOptionDto[]) {
  const uniqueOptions = new Map<string, ModelOptionDto>();

  for (const option of options) {
    const key = toModelSelectValue(option.configId, option.modelName);

    if (!uniqueOptions.has(key)) {
      uniqueOptions.set(key, option);
    }
  }

  return Array.from(uniqueOptions.values());
}

function toggleStyleTag(currentSerializedValue: string, tagId: string) {
  const currentTags = parseSelectedStyleTags(currentSerializedValue);
  const currentWithoutGeneral = currentTags.filter((tag) => tag !== DEFAULT_STYLE_TAG_ID);

  if (tagId === DEFAULT_STYLE_TAG_ID) {
    return updateSelectedTargetStyleTags(currentSerializedValue, [DEFAULT_STYLE_TAG_ID]);
  }

  if (currentWithoutGeneral.includes(tagId)) {
    const nextTags = currentWithoutGeneral.filter((tag) => tag !== tagId);
    return updateSelectedTargetStyleTags(
      currentSerializedValue,
      nextTags.length > 0 ? nextTags : [DEFAULT_STYLE_TAG_ID]
    );
  }

  return updateSelectedTargetStyleTags(currentSerializedValue, [...currentWithoutGeneral, tagId]);
}

function removeStyleTag(currentSerializedValue: string, tagId: string) {
  const currentTags = parseSelectedStyleTags(currentSerializedValue);
  const nextTags = currentTags.filter((tag) => tag !== tagId);

  return updateSelectedTargetStyleTags(
    currentSerializedValue,
    nextTags.length > 0 ? nextTags : [DEFAULT_STYLE_TAG_ID]
  );
}

function notifyUploadError(message: string) {
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
    return;
  }

  console.warn(message);
}

export function WorkspaceEditor({
  workspace,
  modelOptions,
  isSaving,
  isGenerating,
  isRefining,
  onPatchWorkspace,
  onGeneratePrompt,
  onStopGeneratePrompt,
  onRefinePrompt
}: WorkspaceEditorProps) {
  const textModels = dedupeModelOptions(modelOptions.filter((option) => option.configType === "text"));
  const imageModels = dedupeModelOptions(modelOptions.filter((option) => option.configType === "image"));
  const hasModelOptions = modelOptions.length > 0;
  const selectedCameraOrientation = getSelectedCameraOrientation(workspace.selectedTargetType);
  const selectedStyleTags = parseSelectedStyleTags(workspace.selectedTargetType);
  const knownSelectedStyleTags = selectedStyleTags.filter(isKnownStyleTag);
  const customSelectedStyleTags = selectedStyleTags.filter((tag) => !isKnownStyleTag(tag));

  async function appendSourcePromptImages(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const { imageFiles, invalidFiles } = splitImageFiles(files);
    if (invalidFiles.length > 0) {
      notifyUploadError(`以下文件不是图片，已忽略：${invalidFiles.join("、")}`);
    }

    if (imageFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_SOURCE_PROMPT_IMAGES - workspace.sourcePromptImages.length;
    if (remainingSlots <= 0) {
      notifyUploadError(`最多只能上传 ${MAX_SOURCE_PROMPT_IMAGES} 张参考图。`);
      return;
    }

    const acceptedFiles = imageFiles.slice(0, remainingSlots);

    try {
      const uploadedImages = await Promise.all(acceptedFiles.map((file) => toSourcePromptImage(file)));
      onPatchWorkspace({
        sourcePromptImages: [...workspace.sourcePromptImages, ...uploadedImages]
      });

      if (imageFiles.length > acceptedFiles.length) {
        notifyUploadError(
          `最多只能上传 ${MAX_SOURCE_PROMPT_IMAGES} 张参考图，本次仅添加前 ${acceptedFiles.length} 张。`
        );
      }
    } catch (error) {
      notifyUploadError(error instanceof Error ? error.message : "读取参考图失败，请重试。");
    }
  }

  async function handleSourcePromptImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    await appendSourcePromptImages(files);
  }

  async function handleSourcePromptDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    await appendSourcePromptImages(Array.from(event.dataTransfer.files ?? []));
  }

  function handleSourcePromptDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }

  async function handleSourcePromptPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const clipboardItems = Array.from(event.clipboardData?.items ?? []);
    const imageFiles = clipboardItems
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    await appendSourcePromptImages(imageFiles);
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">工作台编辑区</h2>
        <span className="text-xs text-slate-500">{isSaving ? "保存中..." : "就绪"}</span>
      </div>

      {!hasModelOptions ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          暂无可用模型配置，请先前往
          <Link
            href="/configs"
            target="_blank"
            rel="noreferrer"
            className="mx-1 font-medium text-slate-900 underline"
          >
            配置管理页
          </Link>
          添加文本模型或图像模型。
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">模式</span>
          <select
            value={workspace.mode}
            onChange={(event) => onPatchWorkspace({ mode: event.target.value as WorkspaceMode })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">输出语言</span>
          <select
            value={workspace.outputLanguage}
            onChange={(event) => onPatchWorkspace({ outputLanguage: event.target.value as OutputLanguage })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">题材标签</span>
            <span className="text-xs text-slate-500">可多选，会同时影响提示词与图片增强</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-slate-500">当前选择：{formatSelectedStyleLabels(workspace.selectedTargetType)}</p>
                <div className="flex flex-wrap gap-2">
                  {knownSelectedStyleTags.map((tagId) => (
                    <button
                      key={`selected-${tagId}`}
                      type="button"
                      onClick={() =>
                        onPatchWorkspace({
                          selectedTargetType: removeStyleTag(workspace.selectedTargetType, tagId)
                        })
                      }
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                    >
                      {getStyleTagLabel(tagId)} ×
                    </button>
                  ))}
                  {customSelectedStyleTags.map((tagId) => (
                    <button
                      key={`custom-${tagId}`}
                      type="button"
                      onClick={() =>
                        onPatchWorkspace({
                          selectedTargetType: removeStyleTag(workspace.selectedTargetType, tagId)
                        })
                      }
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                    >
                      {tagId} ×
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {STYLE_TAG_GROUPS.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{group.label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_STYLE_TAGS.filter((tag) => tag.group === group.id).map((tag) => {
                        const selected = knownSelectedStyleTags.includes(tag.id);

                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              onPatchWorkspace({
                                selectedTargetType: toggleStyleTag(workspace.selectedTargetType, tag.id)
                              })
                            }
                            className={
                              selected
                                ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                                : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
                            }
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">镜头朝向</span>
          <select
            value={selectedCameraOrientation}
            onChange={(event) =>
              onPatchWorkspace({
                selectedTargetType: updateSelectedTargetCameraOrientation(
                  workspace.selectedTargetType,
                  event.target.value as (typeof CAMERA_ORIENTATION_OPTIONS)[number]["value"]
                )
              })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {CAMERA_ORIENTATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {selectedCameraOrientation === "auto"
              ? `${getAutoCameraOrientationUiHint(workspace.selectedTargetType)}；AI 会根据题材与内容自动选择更合适的镜头朝向。`
              : "已锁定镜头朝向，AI 会尽量按你的指定方向生成，不再自由判断。"}
          </p>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">文本模型</span>
          <select
            value={
              workspace.selectedTextConfig && workspace.selectedTextModel
                ? toModelSelectValue(workspace.selectedTextConfig, workspace.selectedTextModel)
                : ""
            }
            onChange={(event) => {
              const selected = textModels.find(
                (option) => toModelSelectValue(option.configId, option.modelName) === event.target.value
              );
              onPatchWorkspace({
                selectedTextConfig: selected?.configId ?? null,
                selectedTextModel: selected?.modelName ?? null
              });
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">请选择文本模型</option>
            {textModels.map((option) => (
              <option
                key={toModelSelectValue(option.configId, option.modelName)}
                value={toModelSelectValue(option.configId, option.modelName)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">图像模型</span>
          <select
            value={
              workspace.selectedImageConfig && workspace.selectedImageModel
                ? toModelSelectValue(workspace.selectedImageConfig, workspace.selectedImageModel)
                : ""
            }
            onChange={(event) => {
              const selected = imageModels.find(
                (option) => toModelSelectValue(option.configId, option.modelName) === event.target.value
              );
              onPatchWorkspace({
                selectedImageConfig: selected?.configId ?? null,
                selectedImageModel: selected?.modelName ?? null
              });
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">请选择图像模型</option>
            {imageModels.map((option) => (
              <option
                key={`${option.configId}:${option.modelName}`}
                value={toModelSelectValue(option.configId, option.modelName)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">图片比例</span>
          <select
            value={workspace.selectedImageAspectRatio}
            onChange={(event) =>
              onPatchWorkspace({ selectedImageAspectRatio: event.target.value as ImageAspectRatio })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {IMAGE_ASPECT_RATIOS.map((aspectRatio) => (
              <option key={aspectRatio} value={aspectRatio}>
                {aspectRatio === "auto" ? "auto（自动）" : aspectRatio}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">原始提示词</span>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
              上传参考图
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleSourcePromptImageUpload}
              />
            </label>
          </div>
          <div
            className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3"
            onDrop={handleSourcePromptDrop}
            onDragOver={handleSourcePromptDragOver}
          >
            <textarea
              value={workspace.sourcePrompt}
              onChange={(event) => onPatchWorkspace({ sourcePrompt: event.target.value })}
              onPaste={handleSourcePromptPaste}
              className="min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              placeholder="可输入文字描述，也可以只上传图片作为参考。"
            />
            <p className="text-xs text-slate-500">
              支持把图片直接拖到这里上传，也支持在文本框里按 <span className="font-medium">Ctrl+V</span> 粘贴截图。
            </p>
          </div>
          <p className="text-xs text-slate-500">
            可输入文字、上传图片，或两者一起使用。最多 {MAX_SOURCE_PROMPT_IMAGES} 张参考图，每张不超过{" "}
            {formatSourcePromptImageFileSize(MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES)}。
          </p>
          {workspace.sourcePromptImages.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {workspace.sourcePromptImages.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="h-32 w-full bg-slate-200 object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900" title={image.name}>
                        {image.name}
                      </p>
                      <p className="text-xs text-slate-500">{formatSourcePromptImageFileSize(image.sizeBytes)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onPatchWorkspace({
                          sourcePromptImages: workspace.sourcePromptImages.filter(
                            (currentImage) => currentImage.id !== image.id
                          )
                        })
                      }
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700"
                    >
                      移除图片
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGeneratePrompt}
            disabled={isGenerating}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGenerating ? "生成中..." : "生成提示词"}
          </button>
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneratePrompt}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
            >
              停止生成
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRefinePrompt}
            disabled={isRefining}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isRefining ? "优化中..." : "优化提示词"}
          </button>
        </div>
      </div>
    </section>
  );
}
