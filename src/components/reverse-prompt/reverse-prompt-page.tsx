"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createReverseWorkspace,
  deleteReverseWorkspace,
  listModelOptions,
  listReverseWorkspaces,
  reversePrompt,
  updateReverseWorkspace
} from "@/lib/workbench-client";
import {
  formatSourcePromptImageFileSize,
  splitImageFiles,
  toSourcePromptImage
} from "@/lib/source-prompt-images";
import type {
  ModelOptionDto,
  OutputLanguage,
  PromptSummary,
  ReverseWorkspaceDto,
  UpdateReverseWorkspaceRequest
} from "@/lib/types";
import {
  MAX_SOURCE_PROMPT_IMAGES,
  MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES
} from "@/lib/types";

import {
  ReverseWorkspaceList,
  type ReverseWorkspaceListItem
} from "./reverse-workspace-list";

const languages: OutputLanguage[] = ["zh", "en"];
const summaryFields: Array<{ key: Exclude<keyof PromptSummary, "extras">; label: string }> = [
  { key: "style", label: "风格" },
  { key: "scene", label: "场景" },
  { key: "time", label: "时间/光线" },
  { key: "mood", label: "氛围" },
  { key: "quality", label: "质量" },
  { key: "composition", label: "构图/镜头" }
];

type PatchWorkspaceOptions = {
  resetResult?: boolean;
  persist?: boolean;
  persistPatch?: UpdateReverseWorkspaceRequest;
};

function toModelSelectValue(configId: string | null, modelName: string | null) {
  if (!configId || !modelName) {
    return "";
  }

  return `${configId}::${modelName}`;
}

function parseModelSelectValue(value: string) {
  const [configId, ...modelNameParts] = value.split("::");
  const modelName = modelNameParts.join("::");

  if (!configId || !modelName) {
    return null;
  }

  return { configId, modelName };
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function buildWorkspaceTitle(workspaceCount: number) {
  return `逆推工作台 ${workspaceCount + 1}`;
}

function applyWorkspacePatch(
  workspace: ReverseWorkspaceDto,
  patch: UpdateReverseWorkspaceRequest,
  resetResult: boolean
) {
  const next: ReverseWorkspaceDto = {
    ...workspace,
    ...patch
  };

  if (resetResult) {
    next.result = null;
    next.errorMessage = null;
    if (next.status !== "generating") {
      next.status = "idle";
    }
  }

  return next;
}

export function ReversePromptPage() {
  const [workspaces, setWorkspaces] = useState<ReverseWorkspaceDto[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOptionDto[]>([]);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [copyingWorkspaceId, setCopyingWorkspaceId] = useState<string | null>(null);
  const controllersRef = useRef<Record<string, AbortController>>({});
  const workspacesRef = useRef<ReverseWorkspaceDto[]>([]);
  const pendingWorkspaceSavesRef = useRef<Record<string, UpdateReverseWorkspaceRequest>>({});
  const workspaceSaveInFlightRef = useRef<Record<string, boolean>>({});
  const deletedWorkspaceIdsRef = useRef<Set<string>>(new Set());
  const isUnmountedRef = useRef(false);

  const textModels = useMemo(
    () => dedupeModelOptions(modelOptions.filter((option) => option.configType === "text")),
    [modelOptions]
  );

  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  const flushNextWorkspaceSave = useCallback(async (workspaceId: string) => {
    if (workspaceSaveInFlightRef.current[workspaceId]) {
      return;
    }

    const pendingPatch = pendingWorkspaceSavesRef.current[workspaceId];
    if (!pendingPatch) {
      return;
    }

    delete pendingWorkspaceSavesRef.current[workspaceId];
    workspaceSaveInFlightRef.current[workspaceId] = true;

    try {
      await updateReverseWorkspace(workspaceId, pendingPatch);

      if (!isUnmountedRef.current) {
        setPageErrorMessage(null);
      }
    } catch (error) {
      if (!deletedWorkspaceIdsRef.current.has(workspaceId) && !isUnmountedRef.current) {
        setPageErrorMessage(getErrorMessage(error, "保存逆推工作台失败，请稍后重试。"));
      }
    } finally {
      delete workspaceSaveInFlightRef.current[workspaceId];

      if (pendingWorkspaceSavesRef.current[workspaceId]) {
        void flushNextWorkspaceSave(workspaceId);
      }
    }
  }, []);

  function enqueueWorkspaceSave(workspaceId: string, patch: UpdateReverseWorkspaceRequest) {
    if (deletedWorkspaceIdsRef.current.has(workspaceId)) {
      return;
    }

    pendingWorkspaceSavesRef.current[workspaceId] = {
      ...(pendingWorkspaceSavesRef.current[workspaceId] ?? {}),
      ...patch
    };

    void flushNextWorkspaceSave(workspaceId);
  }

  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      isUnmountedRef.current = true;

      Object.values(controllers).forEach((controller) => controller.abort());
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      setIsLoadingInitialData(true);

      try {
        const [loadedWorkspaces, loadedModelOptions] = await Promise.all([
          listReverseWorkspaces(),
          listModelOptions()
        ]);

        const nextWorkspaces =
          loadedWorkspaces.length > 0
            ? loadedWorkspaces
            : [await createReverseWorkspace({ title: buildWorkspaceTitle(0) })];

        if (ignore) {
          return;
        }

        deletedWorkspaceIdsRef.current.clear();
        setWorkspaces(nextWorkspaces);
        setModelOptions(loadedModelOptions);
        setActiveWorkspaceId((current) =>
          current && nextWorkspaces.some((workspace) => workspace.id === current)
            ? current
            : nextWorkspaces[0]?.id ?? null
        );
        setPageErrorMessage(null);
      } catch (error) {
        if (ignore) {
          return;
        }

        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setPageErrorMessage(getErrorMessage(error, "加载逆推工作台或模型列表失败，请稍后重试。"));
      } finally {
        if (!ignore) {
          setIsLoadingInitialData(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const defaultTextModel = textModels[0];
    if (!defaultTextModel || workspaces.length === 0) {
      return;
    }

    const workspaceIdsToHydrate = workspaces
      .filter((workspace) => !workspace.selectedTextConfig || !workspace.selectedTextModel)
      .map((workspace) => workspace.id);

    if (workspaceIdsToHydrate.length === 0) {
      return;
    }

    const patch: UpdateReverseWorkspaceRequest = {
      selectedTextConfig: defaultTextModel.configId,
      selectedTextModel: defaultTextModel.modelName
    };

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspaceIdsToHydrate.includes(workspace.id)
          ? {
              ...workspace,
              ...patch
            }
          : workspace
      )
    );

    for (const workspaceId of workspaceIdsToHydrate) {
      pendingWorkspaceSavesRef.current[workspaceId] = {
        ...(pendingWorkspaceSavesRef.current[workspaceId] ?? {}),
        ...patch
      };
      void flushNextWorkspaceSave(workspaceId);
    }
  }, [textModels, workspaces, flushNextWorkspaceSave]);

  useEffect(() => {
    if (activeWorkspaceId && workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      return;
    }

    setActiveWorkspaceId(workspaces[0]?.id ?? null);
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  const activeWorkspaceModelValue = activeWorkspace
    ? toModelSelectValue(activeWorkspace.selectedTextConfig, activeWorkspace.selectedTextModel)
    : "";
  const isSubmitting = activeWorkspace?.status === "generating";
  const isCopying = activeWorkspace ? copyingWorkspaceId === activeWorkspace.id : false;

  const workspaceListItems = useMemo<ReverseWorkspaceListItem[]>(
    () =>
      workspaces.map((workspace) => ({
        id: workspace.id,
        title: workspace.title,
        status: workspace.status,
        imageCount: workspace.sourcePromptImages.length,
        hasResult: Boolean(workspace.result?.finalPrompt)
      })),
    [workspaces]
  );

  function updateWorkspaceInState(
    workspaceId: string,
    updater: (workspace: ReverseWorkspaceDto) => ReverseWorkspaceDto
  ) {
    setWorkspaces((current) =>
      current.map((workspace) => (workspace.id === workspaceId ? updater(workspace) : workspace))
    );
  }

  function patchWorkspace(
    workspaceId: string,
    patch: UpdateReverseWorkspaceRequest,
    options: PatchWorkspaceOptions = {}
  ) {
    const currentWorkspace = workspacesRef.current.find((workspace) => workspace.id === workspaceId);
    if (!currentWorkspace) {
      return;
    }

    const resetResult = options.resetResult ?? true;
    const nextWorkspace = applyWorkspacePatch(currentWorkspace, patch, resetResult);

    setWorkspaces((current) =>
      current.map((workspace) => (workspace.id === workspaceId ? nextWorkspace : workspace))
    );

    if (options.persist ?? true) {
      const persistPatch: UpdateReverseWorkspaceRequest = options.persistPatch
        ? { ...options.persistPatch }
        : { ...patch };

      if (resetResult) {
        persistPatch.result = null;
        persistPatch.errorMessage = null;
        if (nextWorkspace.status !== "generating") {
          persistPatch.status = "idle";
        }
      }

      enqueueWorkspaceSave(workspaceId, persistPatch);
    }
  }

  function setWorkspaceError(workspaceId: string, message: string | null) {
    updateWorkspaceInState(workspaceId, (workspace) => ({
      ...workspace,
      errorMessage: message,
      status: message ? "error" : workspace.status
    }));
  }

  async function handleCreateWorkspace() {
    setIsCreating(true);

    try {
      const created = await createReverseWorkspace({
        title: buildWorkspaceTitle(workspacesRef.current.length)
      });
      const defaultTextModel = textModels[0];
      const nextWorkspace =
        defaultTextModel
          ? {
              ...created,
              selectedTextConfig: defaultTextModel.configId,
              selectedTextModel: defaultTextModel.modelName
            }
          : created;

      setWorkspaces((current) => [...current, nextWorkspace]);
      setActiveWorkspaceId(nextWorkspace.id);
      setPageErrorMessage(null);

      if (defaultTextModel) {
        enqueueWorkspaceSave(nextWorkspace.id, {
          selectedTextConfig: defaultTextModel.configId,
          selectedTextModel: defaultTextModel.modelName
        });
      }
    } catch (error) {
      setPageErrorMessage(getErrorMessage(error, "创建逆推工作台失败，请稍后重试。"));
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    setDeletingWorkspaceId(workspaceId);
    deletedWorkspaceIdsRef.current.add(workspaceId);
    controllersRef.current[workspaceId]?.abort();
    delete pendingWorkspaceSavesRef.current[workspaceId];

    try {
      await deleteReverseWorkspace(workspaceId);
      setWorkspaces((current) => current.filter((workspace) => workspace.id !== workspaceId));
      setPageErrorMessage(null);
    } catch (error) {
      deletedWorkspaceIdsRef.current.delete(workspaceId);
      setPageErrorMessage(getErrorMessage(error, "删除逆推工作台失败，请稍后重试。"));
    } finally {
      setDeletingWorkspaceId(null);
      delete controllersRef.current[workspaceId];
      delete pendingWorkspaceSavesRef.current[workspaceId];
      delete workspaceSaveInFlightRef.current[workspaceId];
    }
  }

  async function appendSourcePromptImages(workspaceId: string, files: File[]) {
    if (files.length === 0) {
      return;
    }

    const targetWorkspace = workspacesRef.current.find((workspace) => workspace.id === workspaceId);
    if (!targetWorkspace) {
      return;
    }

    const { imageFiles, invalidFiles } = splitImageFiles(files);
    if (invalidFiles.length > 0) {
      setWorkspaceError(workspaceId, `以下文件不是图片，已忽略：${invalidFiles.join("、")}`);
    }

    if (imageFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_SOURCE_PROMPT_IMAGES - targetWorkspace.sourcePromptImages.length;
    if (remainingSlots <= 0) {
      setWorkspaceError(workspaceId, `最多只能上传 ${MAX_SOURCE_PROMPT_IMAGES} 张参考图。`);
      return;
    }

    const acceptedFiles = imageFiles.slice(0, remainingSlots);

    try {
      const uploadedImages = await Promise.all(acceptedFiles.map((file) => toSourcePromptImage(file)));
      const nextImages = [...targetWorkspace.sourcePromptImages, ...uploadedImages];
      const warningMessage =
        imageFiles.length > acceptedFiles.length
          ? `最多只能上传 ${MAX_SOURCE_PROMPT_IMAGES} 张参考图，本次仅添加前 ${acceptedFiles.length} 张。`
          : null;

      updateWorkspaceInState(workspaceId, (workspace) => ({
        ...workspace,
        sourcePromptImages: nextImages,
        result: null,
        errorMessage: warningMessage,
        status: "idle"
      }));

      enqueueWorkspaceSave(workspaceId, {
        sourcePromptImages: nextImages,
        result: null,
        errorMessage: null,
        status: "idle"
      });
    } catch (error) {
      setWorkspaceError(workspaceId, getErrorMessage(error, "读取参考图失败，请重试。"));
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!activeWorkspace) {
      return;
    }

    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    await appendSourcePromptImages(activeWorkspace.id, files);
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!activeWorkspace) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    await appendSourcePromptImages(activeWorkspace.id, Array.from(event.dataTransfer.files ?? []));
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (!activeWorkspace) {
      return;
    }

    const clipboardItems = Array.from(event.clipboardData?.items ?? []);
    const imageFiles = clipboardItems
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    await appendSourcePromptImages(activeWorkspace.id, imageFiles);
  }

  async function handleSubmit() {
    if (!activeWorkspace) {
      return;
    }

    const workspaceId = activeWorkspace.id;
    const selectedTextConfig = activeWorkspace.selectedTextConfig;
    const selectedTextModel = activeWorkspace.selectedTextModel;

    if (!selectedTextConfig || !selectedTextModel) {
      setWorkspaceError(workspaceId, "请先选择一个支持看图能力的文本模型。");
      return;
    }

    if (activeWorkspace.sourcePromptImages.length === 0) {
      setWorkspaceError(workspaceId, "请至少上传一张参考图。");
      return;
    }

    if (controllersRef.current[workspaceId]) {
      return;
    }

    const controller = new AbortController();
    controllersRef.current[workspaceId] = controller;

    updateWorkspaceInState(workspaceId, (workspace) => ({
      ...workspace,
      errorMessage: null,
      result: null,
      status: "generating"
    }));

    enqueueWorkspaceSave(workspaceId, {
      selectedTextConfig,
      selectedTextModel,
      outputLanguage: activeWorkspace.outputLanguage,
      sourcePromptImages: activeWorkspace.sourcePromptImages,
      userInstruction: activeWorkspace.userInstruction,
      result: null,
      errorMessage: null,
      status: "generating"
    });

    try {
      const response = await reversePrompt(
        {
          selectedConfigId: selectedTextConfig,
          selectedTextModel,
          outputLanguage: activeWorkspace.outputLanguage,
          sourcePromptImages: activeWorkspace.sourcePromptImages,
          userInstruction: activeWorkspace.userInstruction
        },
        { signal: controller.signal }
      );

      updateWorkspaceInState(workspaceId, (workspace) => ({
        ...workspace,
        result: response,
        errorMessage: null,
        status: "completed"
      }));

      enqueueWorkspaceSave(workspaceId, {
        result: response,
        errorMessage: null,
        status: "completed"
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updateWorkspaceInState(workspaceId, (workspace) => ({
          ...workspace,
          errorMessage: null,
          status: "idle"
        }));

        enqueueWorkspaceSave(workspaceId, {
          errorMessage: null,
          status: "idle"
        });
        return;
      }

      const message = getErrorMessage(error, "逆推提示词失败，请稍后重试。");

      updateWorkspaceInState(workspaceId, (workspace) => ({
        ...workspace,
        errorMessage: message,
        status: "error"
      }));

      enqueueWorkspaceSave(workspaceId, {
        errorMessage: message,
        status: "error"
      });
    } finally {
      delete controllersRef.current[workspaceId];
    }
  }

  function handleStopSubmit() {
    if (!activeWorkspace) {
      return;
    }

    controllersRef.current[activeWorkspace.id]?.abort();
  }

  async function handleCopyPrompt() {
    if (!activeWorkspace?.result?.finalPrompt || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    setCopyingWorkspaceId(activeWorkspace.id);
    try {
      await navigator.clipboard.writeText(activeWorkspace.result.finalPrompt);
    } finally {
      setCopyingWorkspaceId((current) => (current === activeWorkspace.id ? null : current));
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">图片逆推提示词</h1>
            <p className="text-sm text-slate-600">
              上传一张或多张参考图，让 AI 根据画面内容逆推出可直接复用的图像提示词。支持多工作台并发逆推。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              返回工作台
            </Link>
            <Link
              href="/configs"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              模型配置
            </Link>
          </div>
        </header>

        {pageErrorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageErrorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start xl:grid-cols-[300px_minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <aside className="min-w-0">
            <ReverseWorkspaceList
              workspaces={workspaceListItems}
              activeWorkspaceId={activeWorkspaceId}
              isCreating={isCreating}
              deletingWorkspaceId={deletingWorkspaceId}
              onCreateWorkspace={handleCreateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
            />
          </aside>

          {activeWorkspace ? (
            [
              <section key="editor-column" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">输入区</h2>
                  <span className="text-xs text-slate-500">
                    {isLoadingInitialData
                      ? "加载中..."
                      : activeWorkspace.status === "generating"
                        ? "逆推中..."
                        : "就绪"}
                  </span>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                  建议选择支持视觉 / 看图能力的文本模型，否则 provider 可能无法识别上传图片。
                </div>

                {activeWorkspace.errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                    {activeWorkspace.errorMessage}
                  </div>
                ) : null}

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="font-medium">文本模型</span>
                  <select
                    value={activeWorkspaceModelValue}
                    onChange={(event) => {
                      const nextSelection = parseModelSelectValue(event.target.value);

                      patchWorkspace(
                        activeWorkspace.id,
                        nextSelection
                          ? {
                              selectedTextConfig: nextSelection.configId,
                              selectedTextModel: nextSelection.modelName
                            }
                          : {
                              selectedTextConfig: null,
                              selectedTextModel: null
                            }
                      );
                    }}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  <span className="font-medium">输出语言</span>
                  <select
                    value={activeWorkspace.outputLanguage}
                    onChange={(event) =>
                      patchWorkspace(activeWorkspace.id, {
                        outputLanguage: event.target.value as OutputLanguage
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="font-medium">附加要求（可选）</span>
                  <textarea
                    value={activeWorkspace.userInstruction}
                    onChange={(event) =>
                      patchWorkspace(activeWorkspace.id, {
                        userInstruction: event.target.value
                      })
                    }
                    onPaste={handlePaste}
                    disabled={isSubmitting}
                    className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="例如：更偏 Midjourney 风格、保留服饰细节、不要加入画面中看不到的元素。也支持在此按 Ctrl+V 粘贴截图。"
                  />
                </label>

                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium">参考图片</span>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                        上传图片
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={isSubmitting}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          patchWorkspace(activeWorkspace.id, {
                            sourcePromptImages: []
                          })
                        }
                        disabled={isSubmitting || activeWorkspace.sourcePromptImages.length === 0}
                        className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        清空图片
                      </button>
                    </div>
                  </div>

                  <div
                    className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
                    onDrop={(event) => void handleDrop(event)}
                    onDragOver={handleDragOver}
                  >
                    <p className="text-sm text-slate-700">
                      把图片直接拖到这里上传，或者使用上方按钮选择文件。
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      最多 {MAX_SOURCE_PROMPT_IMAGES} 张，每张不超过{" "}
                      {formatSourcePromptImageFileSize(MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES)}。
                    </p>
                  </div>

                  {activeWorkspace.sourcePromptImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeWorkspace.sourcePromptImages.map((image) => (
                        <div
                          key={image.id}
                          className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            className="h-40 w-full bg-slate-200 object-cover"
                          />
                          <div className="space-y-2 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900" title={image.name}>
                                {image.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatSourcePromptImageFileSize(image.sizeBytes)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                patchWorkspace(activeWorkspace.id, {
                                  sourcePromptImages: activeWorkspace.sourcePromptImages.filter(
                                    (currentImage) => currentImage.id !== image.id
                                  )
                                })
                              }
                              disabled={isSubmitting}
                              className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              移除图片
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                      还没有上传参考图。
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={
                      isSubmitting ||
                      !activeWorkspace.selectedTextConfig ||
                      !activeWorkspace.selectedTextModel ||
                      activeWorkspace.sourcePromptImages.length === 0
                    }
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSubmitting ? "逆推中..." : "开始逆推提示词"}
                  </button>
                  {isSubmitting ? (
                    <button
                      type="button"
                      onClick={handleStopSubmit}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700"
                    >
                      停止逆推
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      patchWorkspace(
                        activeWorkspace.id,
                        {
                          result: null,
                          errorMessage: null,
                          status: "idle"
                        },
                        { resetResult: false }
                      )
                    }
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700"
                  >
                    清空结果
                  </button>
                </div>
              </section>,

              <section key="result-column" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">逆推结果</h2>
                  <button
                    type="button"
                    onClick={() => void handleCopyPrompt()}
                    disabled={!activeWorkspace.result?.finalPrompt || isCopying}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {isCopying ? "复制中..." : "复制提示词"}
                  </button>
                </div>

                {activeWorkspace.result?.finalPrompt ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-900">可直接使用的提示词</h3>
                      <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                        {activeWorkspace.result.finalPrompt}
                      </pre>
                    </div>

                    {activeWorkspace.result.summary ? (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-900">画面摘要</h3>
                        <dl className="grid gap-3 sm:grid-cols-2">
                          {summaryFields.map((field) => (
                            <div key={field.key} className="rounded-lg border border-slate-200 p-3 text-sm">
                              <dt className="font-medium text-slate-900">{field.label}</dt>
                              <dd className="mt-1 text-slate-600">
                                {activeWorkspace.result?.summary?.[field.key]}
                              </dd>
                            </div>
                          ))}
                          <div className="rounded-lg border border-slate-200 p-3 text-sm sm:col-span-2">
                            <dt className="font-medium text-slate-900">补充细节</dt>
                            <dd className="mt-1 text-slate-600">
                              {activeWorkspace.result.summary.extras.length > 0
                                ? activeWorkspace.result.summary.extras.join("，")
                                : "无"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-900">上下文快照</h3>
                      <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        {JSON.stringify(activeWorkspace.result.contextSnapshot, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                    选择当前工作台的参考图并开始逆推后，结果会显示在这里。你可以切换到其他工作台继续并发处理。
                  </p>
                )}
              </section>
            ]
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 lg:col-span-2">
              {isLoadingInitialData ? "正在加载逆推工作台..." : "请选择一个逆推工作台，或先创建一个新的工作台。"}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
