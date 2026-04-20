"use client";

import React from "react";
import type { GenerateImageResult, WorkspaceDto } from "@/lib/types";

type PromptResultPanelProps = {
  workspace: WorkspaceDto;
  refineDraft: string;
  imageResult: GenerateImageResult | null;
  isCopying: boolean;
  isGeneratingImage: boolean;
  isDiagnosingImage: boolean;
  canGenerateImage: boolean;
  canDiagnoseImage: boolean;
  onRefineDraftChange: (value: string) => void;
  onCopyPrompt: () => void;
  onGenerateImage: () => void;
  onStopGenerateImage: () => void;
  onDiagnoseImage: () => void;
};

const summaryFields: Array<{ key: keyof NonNullable<WorkspaceDto["parameterSummary"]>; label: string }> = [
  { key: "style", label: "风格" },
  { key: "scene", label: "场景" },
  { key: "time", label: "时间" },
  { key: "mood", label: "氛围" },
  { key: "quality", label: "质量" },
  { key: "composition", label: "构图" }
];

export function PromptResultPanel({
  workspace,
  refineDraft,
  imageResult,
  isCopying,
  isGeneratingImage,
  isDiagnosingImage,
  canGenerateImage,
  canDiagnoseImage,
  onRefineDraftChange,
  onCopyPrompt,
  onGenerateImage,
  onStopGenerateImage,
  onDiagnoseImage
}: PromptResultPanelProps) {
  function openImage(url: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function downloadImage(url: string, index: number) {
    if (typeof document === "undefined") {
      return;
    }

    const safeTitle = workspace.title.trim() ? workspace.title.trim() : "workspace";
    const resultImageModel = imageResult?.selectedImageModel ?? workspace.selectedImageModel ?? "image";
    const resultImageAspectRatio =
      imageResult?.selectedImageAspectRatio ?? workspace.selectedImageAspectRatio;
    const filenameBase = [safeTitle, resultImageModel, resultImageAspectRatio, `${index + 1}`]
      .join("-")
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "_");

    const anchor = document.createElement("a");

    if (url.startsWith("data:")) {
      anchor.href = url;
      anchor.download = `${filenameBase}.png`;
      anchor.click();
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Image download failed with ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const extension =
        blob.type === "image/jpeg"
          ? "jpg"
          : blob.type === "image/webp"
            ? "webp"
            : "png";

      anchor.href = objectUrl;
      anchor.download = `${filenameBase}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      openImage(url);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">结果区</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDiagnoseImage}
            disabled={!canDiagnoseImage || isDiagnosingImage}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isDiagnosingImage ? "测试中..." : "测试图片通道"}
          </button>
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={!canGenerateImage || isGeneratingImage}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGeneratingImage ? "出图中..." : "生成图片"}
          </button>
          {isGeneratingImage ? (
            <button
              type="button"
              onClick={onStopGenerateImage}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
            >
              停止生成
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCopyPrompt}
            disabled={!workspace.finalPrompt || isCopying}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isCopying ? "复制中..." : "复制提示词"}
          </button>
        </div>
      </div>

      {workspace.finalPrompt ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900">最终提示词</h3>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-slate-100">
              {workspace.finalPrompt}
            </pre>
          </div>

          {workspace.parameterSummary ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900">参数摘要</h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {summaryFields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <dt className="font-medium text-slate-900">{field.label}</dt>
                    <dd className="mt-1 text-slate-600">{workspace.parameterSummary?.[field.key]}</dd>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 p-3 text-sm sm:col-span-2">
                  <dt className="font-medium text-slate-900">补充信息</dt>
                  <dd className="mt-1 text-slate-600">
                    {workspace.parameterSummary.extras.length > 0
                      ? workspace.parameterSummary.extras.join(", ")
                      : "无"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-slate-900">图片结果</h3>
              <span className="text-xs text-slate-500">
                {(imageResult?.selectedImageModel ?? workspace.selectedImageModel)
                  ? `结果来源模型：${imageResult?.selectedImageModel ?? workspace.selectedImageModel} · 比例：${imageResult?.selectedImageAspectRatio ?? workspace.selectedImageAspectRatio}`
                  : "未选择图像模型"}
              </span>
            </div>

            {imageResult ? (
              <div className="space-y-3">
                {imageResult.usedPrompt ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-medium text-slate-900">本次实际生图提示词</h4>
                      <span className="text-xs text-slate-500">
                        {imageResult.promptSource === "enhanced" ? "来源：增强后提示词" : "来源：最终提示词"}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-700">{imageResult.usedPrompt}</pre>
                    {imageResult.promptEnhancementError ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        提示词增强未完全生效，已自动回退。原因：{imageResult.promptEnhancementError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {imageResult.revisedPrompt ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Provider revised prompt：{imageResult.revisedPrompt}
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {imageResult.images.map((image, index) => (
                    <div
                      key={`${index}-${image.url.slice(0, 32)}`}
                      className="space-y-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"
                    >
                      <button
                        type="button"
                        onDoubleClick={() => openImage(image.url)}
                        onClick={() => undefined}
                        className="block w-full overflow-hidden rounded-lg"
                        title="双击打开原图"
                      >
                        <img
                          src={image.url}
                          alt={`Generated result ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openImage(image.url)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700"
                        >
                          打开原图
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadImage(image.url, index)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700"
                        >
                          下载图片
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                {workspace.selectedImageModel ? "还没有图片结果。" : "请选择图像模型后生成图片。"}
              </p>
            )}
          </div>

          <label className="block space-y-1 text-sm text-slate-700">
            <span className="font-medium">优化指令</span>
            <textarea
              value={refineDraft}
              onChange={(event) => onRefineDraftChange(event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          还没有生成结果。
        </p>
      )}
    </section>
  );
}
