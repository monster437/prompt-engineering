"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  DiagnoseImageProviderResult,
  ModelOptionDto,
  WorkspaceDto
} from "@/lib/types";
import {
  createWorkspace,
  deleteWorkspace,
  diagnoseImageProvider,
  generateImage,
  generatePrompt,
  listModelOptions,
  listWorkspaces,
  refinePrompt,
  updateWorkspace
} from "@/lib/workbench-client";

import type { WorkbenchLogEntry } from "./workbench-log-panel";
import { WorkbenchShell } from "./workbench-shell";
import type { WorkspaceActivityState } from "./workspace-list";

function buildPromptPreview(prompt: string | null | undefined, maxLength = 240) {
  if (!prompt) {
    return "无";
  }

  return prompt.length > maxLength ? `${prompt.slice(0, maxLength)}...` : prompt;
}

type WorkspacePendingMap = Record<string, boolean>;

function setWorkspacePending(
  setter: React.Dispatch<React.SetStateAction<WorkspacePendingMap>>,
  workspaceId: string,
  pending: boolean
) {
  setter((current) => {
    if (pending) {
      return {
        ...current,
        [workspaceId]: true
      };
    }

    if (!current[workspaceId]) {
      return current;
    }

    const next = { ...current };
    delete next[workspaceId];
    return next;
  });
}

export function WorkbenchPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOptionDto[]>([]);
  const [logs, setLogs] = useState<WorkbenchLogEntry[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [refineDraft, setRefineDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingWorkspaceId, setIsDeletingWorkspaceId] = useState<string | null>(null);
  const [savingWorkspaceIds, setSavingWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [generatingWorkspaceIds, setGeneratingWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [refiningWorkspaceIds, setRefiningWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [generatingImageWorkspaceIds, setGeneratingImageWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [diagnosingImageWorkspaceIds, setDiagnosingImageWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [submittingAnswerWorkspaceIds, setSubmittingAnswerWorkspaceIds] = useState<WorkspacePendingMap>({});
  const [isCopying, setIsCopying] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const promptControllersRef = useRef<Record<string, AbortController>>({});
  const imageControllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    async function loadInitialData() {
      appendLog("info", "初始化加载", "开始加载工作台与模型列表。");

      try {
        const [loadedWorkspaces, loadedModels] = await Promise.all([listWorkspaces(), listModelOptions()]);
        setWorkspaces(loadedWorkspaces);
        setModelOptions(loadedModels);
        setActiveWorkspaceId((current) => current ?? loadedWorkspaces[0]?.id ?? null);
        appendLog(
          "success",
          "初始化加载",
          "工作台与模型列表加载成功。",
          toLogDetails({
            workspaceCount: loadedWorkspaces.length,
            modelCount: loadedModels.length
          })
        );
      } catch (error) {
        const message = getErrorMessage(error, "初始化加载失败，请刷新页面重试。");
        setErrorMessage(message);
        appendLog("error", "初始化加载", message, toLogDetails({}, error));
      }
    }

    void loadInitialData();
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );
  const isSaving = activeWorkspace ? Boolean(savingWorkspaceIds[activeWorkspace.id]) : false;
  const isGenerating = activeWorkspace ? Boolean(generatingWorkspaceIds[activeWorkspace.id]) : false;
  const isRefining = activeWorkspace ? Boolean(refiningWorkspaceIds[activeWorkspace.id]) : false;
  const isGeneratingImage = activeWorkspace ? Boolean(generatingImageWorkspaceIds[activeWorkspace.id]) : false;
  const isDiagnosingImage = activeWorkspace ? Boolean(diagnosingImageWorkspaceIds[activeWorkspace.id]) : false;
  const isSubmittingAnswer = activeWorkspace ? Boolean(submittingAnswerWorkspaceIds[activeWorkspace.id]) : false;

  const pendingQuestion = activeWorkspace
    ? activeWorkspace.questionMessages[activeWorkspace.answers.length] ?? null
    : null;
  const activeImageResult = activeWorkspace?.generatedImageResult ?? null;
  const workspaceActivityById = useMemo<Record<string, WorkspaceActivityState>>(
    () =>
      Object.fromEntries(
        workspaces.map((workspace) => {
          let activity: WorkspaceActivityState = "idle";

          if (generatingImageWorkspaceIds[workspace.id]) {
            activity = "generating_image";
          } else if (generatingWorkspaceIds[workspace.id]) {
            activity = "generating";
          } else if (refiningWorkspaceIds[workspace.id]) {
            activity = "refining";
          } else if (diagnosingImageWorkspaceIds[workspace.id]) {
            activity = "diagnosing_image";
          } else if (submittingAnswerWorkspaceIds[workspace.id]) {
            activity = "submitting_answer";
          } else if (savingWorkspaceIds[workspace.id]) {
            activity = "saving";
          } else if (workspace.status === "asking") {
            activity = "asking";
          } else if (workspace.status === "error") {
            activity = "error";
          }

          return [workspace.id, activity];
        })
      ),
    [
      workspaces,
      generatingImageWorkspaceIds,
      generatingWorkspaceIds,
      refiningWorkspaceIds,
      diagnosingImageWorkspaceIds,
      submittingAnswerWorkspaceIds,
      savingWorkspaceIds
    ]
  );

  function appendLog(
    level: WorkbenchLogEntry["level"],
    action: string,
    message: string,
    details?: string
  ) {
    setLogs((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toISOString(),
        level,
        action,
        message,
        details
      },
      ...current
    ].slice(0, 50));
  }

  function toLogDetails(context: Record<string, unknown>, error?: unknown) {
    const lines = Object.entries(context).map(([key, value]) => `${key}: ${String(value)}`);

    if (error) {
      if (error instanceof Error) {
        lines.push(`error.name: ${error.name}`);
        lines.push(`error.message: ${error.message}`);
      } else {
        lines.push(`error: ${String(error)}`);
      }
    }

    return lines.join("\n");
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  function isAbortError(error: unknown) {
    return error instanceof Error && error.name === "AbortError";
  }

  function updateWorkspaceInState(workspaceId: string, updater: (workspace: WorkspaceDto) => WorkspaceDto) {
    setWorkspaces((current) =>
      current.map((workspace) => (workspace.id === workspaceId ? updater(workspace) : workspace))
    );
  }

  async function refreshWorkspacesFromServer() {
    const loadedWorkspaces = await listWorkspaces();
    setWorkspaces(loadedWorkspaces);
    setActiveWorkspaceId((current) =>
      current && loadedWorkspaces.some((workspace) => workspace.id === current)
        ? current
        : loadedWorkspaces[0]?.id ?? null
    );

    return loadedWorkspaces;
  }

  async function refreshModelOptions() {
    const loadedModels = await listModelOptions();
    setModelOptions(loadedModels);
    return loadedModels;
  }

  function buildDiagnoseImageLogDetails(result: DiagnoseImageProviderResult) {
    return toLogDetails({
      workspaceId: result.workspaceId,
      selectedConfigId: result.selectedConfigId,
      providerName: result.providerName,
      baseURL: result.baseURL,
      selectedImageModel: result.selectedImageModel,
      connectivity: result.connectivity,
      modelsEndpointStatus: result.modelsEndpointStatus ?? "null",
      modelsEndpointStatusText: result.modelsEndpointStatusText ?? "null",
      modelFound: result.modelFound,
      availableModelCount: result.availableModelCount,
      similarModels: result.similarModels.length > 0 ? result.similarModels.join(", ") : "无",
      providerDetails: result.details ?? "无"
    });
  }

  async function syncWorkspace(next: WorkspaceDto) {
    setWorkspaces((current) => current.map((workspace) => (workspace.id === next.id ? next : workspace)));
    const saved = await updateWorkspace(next.id, next);
    setWorkspaces((current) => current.map((workspace) => (workspace.id === saved.id ? saved : workspace)));
  }

  async function handleCreateWorkspace() {
    setIsCreating(true);
    appendLog("info", "新建工作台", "开始创建工作台。", toLogDetails({ nextTitle: `Workspace ${workspaces.length + 1}` }));
    try {
      const created = await createWorkspace({ title: `Workspace ${workspaces.length + 1}` });
      setWorkspaces((current) => [...current, created]);
      setActiveWorkspaceId(created.id);
      setDraftAnswer("");
      setRefineDraft("");
      appendLog("success", "新建工作台", "工作台创建成功。", toLogDetails({ workspaceId: created.id, title: created.title }));
    } catch (error) {
      const message = getErrorMessage(error, "创建工作台失败，请稍后重试。");
      setErrorMessage(message);
      appendLog("error", "新建工作台", message, toLogDetails({}, error));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    setIsDeletingWorkspaceId(workspaceId);
    promptControllersRef.current[workspaceId]?.abort();
    imageControllersRef.current[workspaceId]?.abort();
    appendLog("info", "删除工作台", "开始删除工作台。", toLogDetails({ workspaceId }));
    try {
      await deleteWorkspace(workspaceId);
      setWorkspaces((current) => current.filter((workspace) => workspace.id !== workspaceId));
      setActiveWorkspaceId((current) => (current === workspaceId ? workspaces.find((workspace) => workspace.id !== workspaceId)?.id ?? null : current));
      appendLog("success", "删除工作台", "工作台删除成功。", toLogDetails({ workspaceId }));
    } catch (error) {
      const message = getErrorMessage(error, "删除工作台失败，请稍后重试。");
      setErrorMessage(message);
      appendLog("error", "删除工作台", message, toLogDetails({ workspaceId }, error));
    } finally {
      setIsDeletingWorkspaceId(null);
    }
  }

  function handleSelectWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    setDraftAnswer("");
    setRefineDraft("");
  }

  async function handlePatchWorkspace(patch: Partial<WorkspaceDto>) {
    if (!activeWorkspace) return;
    const workspaceId = activeWorkspace.id;
    setErrorMessage(null);
    setWorkspacePending(setSavingWorkspaceIds, workspaceId, true);
    try {
      const next = { ...activeWorkspace, ...patch };
      await syncWorkspace(next);
    } finally {
      setWorkspacePending(setSavingWorkspaceIds, workspaceId, false);
    }
  }

  async function handleGeneratePrompt() {
    if (!activeWorkspace || !activeWorkspace.selectedTextConfig || !activeWorkspace.selectedTextModel) return;
    const workspace = activeWorkspace;
    const selectedTextConfig = workspace.selectedTextConfig;
    const selectedTextModel = workspace.selectedTextModel;
    if (!selectedTextConfig || !selectedTextModel) return;
    if (promptControllersRef.current[workspace.id]) {
      return;
    }

    const controller = new AbortController();
    promptControllersRef.current[workspace.id] = controller;
    setErrorMessage(null);
    setWorkspacePending(setGeneratingWorkspaceIds, workspace.id, true);
    updateWorkspaceInState(workspace.id, (current) => ({
      ...current,
      status: "generating"
    }));
    appendLog(
      "info",
      "生成提示词",
      "开始生成提示词。",
      toLogDetails({
        workspaceId: workspace.id,
        selectedTextConfig,
        selectedTextModel,
        selectedImageAspectRatio: workspace.selectedImageAspectRatio
      })
    );
    try {
      const result = await generatePrompt({
        workspaceId: workspace.id,
        selectedConfigId: selectedTextConfig,
        selectedTextModel,
        sourcePrompt: workspace.sourcePrompt,
        sourcePromptImages: workspace.sourcePromptImages
      }, {
        signal: controller.signal
      });
      await refreshWorkspacesFromServer();
      appendLog(
        "success",
        "生成提示词",
        result.status === "needs_clarification" ? "提示词生成返回追问。" : "提示词生成成功。",
        toLogDetails({
          workspaceId: workspace.id,
          resultStatus: result.status,
          hasFinalPrompt: Boolean(result.finalPrompt)
        })
      );
    } catch (error) {
      if (isAbortError(error)) {
        updateWorkspaceInState(workspace.id, (current) => ({
          ...current,
          status: "idle"
        }));
        appendLog(
          "info",
          "生成提示词",
          "已停止当前提示词生成请求。",
          toLogDetails({
            workspaceId: workspace.id,
            selectedTextConfig,
            selectedTextModel
          })
        );
        return;
      }

      updateWorkspaceInState(workspace.id, (current) => ({
        ...current,
        status: "error"
      }));
      const message = getErrorMessage(error, "生成失败，请稍后重试。");
      setErrorMessage(message);
      appendLog(
        "error",
        "生成提示词",
        message,
        toLogDetails(
          {
            workspaceId: workspace.id,
            selectedTextConfig,
            selectedTextModel,
            selectedImageAspectRatio: workspace.selectedImageAspectRatio
          },
          error
        )
      );
    } finally {
      delete promptControllersRef.current[workspace.id];
      setWorkspacePending(setGeneratingWorkspaceIds, workspace.id, false);
    }
  }

  async function handleRefinePrompt() {
    if (!activeWorkspace || !activeWorkspace.selectedTextConfig || !activeWorkspace.selectedTextModel || !refineDraft.trim()) return;
    const workspace = activeWorkspace;
    const selectedTextConfig = workspace.selectedTextConfig;
    const selectedTextModel = workspace.selectedTextModel;
    if (!selectedTextConfig || !selectedTextModel) return;
    setErrorMessage(null);
    setWorkspacePending(setRefiningWorkspaceIds, workspace.id, true);
    updateWorkspaceInState(workspace.id, (current) => ({
      ...current,
      status: "refining"
    }));
    appendLog(
      "info",
      "优化提示词",
      "开始优化提示词。",
      toLogDetails({
        workspaceId: workspace.id,
        selectedTextConfig,
        selectedTextModel,
        selectedImageAspectRatio: workspace.selectedImageAspectRatio
      })
    );
    try {
      const result = await refinePrompt({
        workspaceId: workspace.id,
        selectedConfigId: selectedTextConfig,
        selectedTextModel,
        refineInstruction: refineDraft.trim()
      });
      await refreshWorkspacesFromServer();
      appendLog(
        "success",
        "优化提示词",
        "提示词优化成功。",
        toLogDetails({
          workspaceId: workspace.id,
          hasFinalPrompt: Boolean(result.finalPrompt)
        })
      );
    } catch (error) {
      updateWorkspaceInState(workspace.id, (current) => ({
        ...current,
        status: "error"
      }));
      const message = getErrorMessage(error, "优化失败，请稍后重试。");
      setErrorMessage(message);
      appendLog(
        "error",
        "优化提示词",
        message,
        toLogDetails(
          {
            workspaceId: workspace.id,
            selectedTextConfig,
            selectedTextModel,
            selectedImageAspectRatio: workspace.selectedImageAspectRatio
          },
          error
        )
      );
    } finally {
      setWorkspacePending(setRefiningWorkspaceIds, workspace.id, false);
    }
  }

  async function handleGenerateImage() {
    if (!activeWorkspace) return;
    const workspace = activeWorkspace;
    if (imageControllersRef.current[workspace.id]) {
      return;
    }

    const finalPrompt = workspace.finalPrompt?.trim();
    const selectedImageConfig = workspace.selectedImageConfig;
    const selectedImageAspectRatio = workspace.selectedImageAspectRatio;
    const selectedImageModel = workspace.selectedImageModel;

    if (!finalPrompt || !selectedImageConfig || !selectedImageModel) {
      setErrorMessage("请先生成提示词并选择可用的图像模型。");
      appendLog(
        "error",
        "生成图片",
        "生成图片前缺少必要参数。",
        toLogDetails({
          workspaceId: workspace.id,
          hasFinalPrompt: Boolean(finalPrompt),
          selectedImageConfig,
          selectedImageModel,
          selectedImageAspectRatio
        })
      );
      return;
    }

    const controller = new AbortController();
    imageControllersRef.current[workspace.id] = controller;
    setErrorMessage(null);
    setWorkspacePending(setGeneratingImageWorkspaceIds, workspace.id, true);
    appendLog(
      "info",
      "生成图片",
      "开始生成图片。",
      toLogDetails({
        workspaceId: workspace.id,
        selectedImageConfig,
        selectedImageModel,
        selectedImageAspectRatio
      })
    );

    try {
      const result = await generateImage({
        workspaceId: workspace.id,
        selectedConfigId: selectedImageConfig,
        selectedImageModel,
        selectedImageAspectRatio,
        prompt: finalPrompt
      }, {
        signal: controller.signal
      });
      await refreshWorkspacesFromServer();
      appendLog(
        "success",
        "生成图片",
        "图片生成成功。",
        toLogDetails({
          workspaceId: workspace.id,
          selectedImageConfig,
          selectedImageModel,
          selectedImageAspectRatio,
          imageCount: result.images.length,
          promptSource: result.promptSource ?? "unknown",
          usedPromptLength: result.usedPrompt?.length ?? 0,
          usedPromptPreview: buildPromptPreview(result.usedPrompt),
          promptEnhancementError: result.promptEnhancementError ?? "无"
        })
      );
    } catch (error) {
      if (isAbortError(error)) {
        appendLog(
          "info",
          "生成图片",
          "已停止当前图片生成请求。",
          toLogDetails({
            workspaceId: workspace.id,
            selectedImageConfig,
            selectedImageModel,
            selectedImageAspectRatio
          })
        );
        return;
      }

      const message = getErrorMessage(error, "图片生成失败，请稍后重试。");
      setErrorMessage(message);
      appendLog(
        "error",
        "生成图片",
        message,
        toLogDetails(
          {
            workspaceId: workspace.id,
            selectedImageConfig,
            selectedImageModel,
            selectedImageAspectRatio
          },
          error
        )
      );
    } finally {
      delete imageControllersRef.current[workspace.id];
      setWorkspacePending(setGeneratingImageWorkspaceIds, workspace.id, false);
    }
  }

  async function handleDiagnoseImage() {
    if (!activeWorkspace) return;
    const workspace = activeWorkspace;

    const selectedImageConfig = workspace.selectedImageConfig;
    const selectedImageModel = workspace.selectedImageModel;

    if (!selectedImageConfig || !selectedImageModel) {
      setErrorMessage("请先选择可用的图像模型后再测试图片通道。");
      appendLog(
        "error",
        "测试图片通道",
        "测试图片通道前缺少必要参数。",
        toLogDetails({
          workspaceId: workspace.id,
          selectedImageConfig,
          selectedImageModel
        })
      );
      return;
    }

    setErrorMessage(null);
    setWorkspacePending(setDiagnosingImageWorkspaceIds, workspace.id, true);
    appendLog(
      "info",
      "测试图片通道",
      "开始测试图片通道。",
      toLogDetails({
        workspaceId: workspace.id,
        selectedImageConfig,
        selectedImageModel
      })
    );

    try {
      const result = await diagnoseImageProvider({
        workspaceId: workspace.id,
        selectedConfigId: selectedImageConfig,
        selectedImageModel
      });
      const succeeded = result.connectivity === "ok" && result.modelFound;

      setErrorMessage(succeeded ? null : result.message);
      appendLog(
        succeeded ? "success" : "error",
        "测试图片通道",
        result.message,
        buildDiagnoseImageLogDetails(result)
      );
    } catch (error) {
      const message = getErrorMessage(error, "测试图片通道失败，请稍后重试。");
      setErrorMessage(message);
      appendLog(
        "error",
        "测试图片通道",
        message,
        toLogDetails(
          {
            workspaceId: workspace.id,
            selectedImageConfig,
            selectedImageModel
          },
          error
        )
      );
    } finally {
      setWorkspacePending(setDiagnosingImageWorkspaceIds, workspace.id, false);
    }
  }

  async function handleSubmitAnswer() {
    if (!activeWorkspace || !pendingQuestion || !draftAnswer.trim()) return;
    const workspace = activeWorkspace;
    setWorkspacePending(setSubmittingAnswerWorkspaceIds, workspace.id, true);
    appendLog(
      "info",
      "提交回答",
      "开始提交追问回答。",
      toLogDetails({
        workspaceId: workspace.id,
        question: pendingQuestion
      })
    );
    try {
      const nextAnswers = [...workspace.answers, draftAnswer.trim()];
      await syncWorkspace({ ...workspace, answers: nextAnswers, status: "idle" });
      setDraftAnswer("");
      appendLog(
        "success",
        "提交回答",
        "追问回答已保存。",
        toLogDetails({
          workspaceId: workspace.id,
          answerCount: nextAnswers.length
        })
      );
    } catch (error) {
      const message = getErrorMessage(error, "提交回答失败，请稍后重试。");
      setErrorMessage(message);
      appendLog(
        "error",
        "提交回答",
        message,
        toLogDetails(
          {
            workspaceId: workspace.id,
            question: pendingQuestion
          },
          error
        )
      );
    } finally {
      setWorkspacePending(setSubmittingAnswerWorkspaceIds, workspace.id, false);
    }
  }

  function handleStopGeneratePrompt() {
    if (!activeWorkspace) return;

    promptControllersRef.current[activeWorkspace.id]?.abort();
  }

  function handleStopGenerateImage() {
    if (!activeWorkspace) return;

    imageControllersRef.current[activeWorkspace.id]?.abort();
  }

  async function handleCopyPrompt() {
    if (!activeWorkspace?.finalPrompt || typeof navigator === "undefined" || !navigator.clipboard) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(activeWorkspace.finalPrompt);
    } finally {
      setIsCopying(false);
    }
  }

  async function handleConfigsChanged() {
    try {
      const models = await refreshModelOptions();
      appendLog(
        "success",
        "刷新模型配置",
        "模型选项已根据最新配置自动刷新。",
        toLogDetails({ modelCount: models.length })
      );
    } catch (error) {
      const message = getErrorMessage(error, "模型配置已保存，但模型列表刷新失败。");
      setErrorMessage(message);
      appendLog("error", "刷新模型配置", message, toLogDetails({}, error));
    }
  }

  return (
    <WorkbenchShell
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      modelOptions={modelOptions}
      workspaceActivityById={workspaceActivityById}
      pendingQuestion={pendingQuestion}
      draftAnswer={draftAnswer}
      refineDraft={refineDraft}
      imageResult={activeImageResult}
      logs={logs}
      errorMessage={errorMessage}
      isCreating={isCreating}
      isDeletingWorkspaceId={isDeletingWorkspaceId}
      isSaving={isSaving}
      isGenerating={isGenerating}
      isRefining={isRefining}
      isGeneratingImage={isGeneratingImage}
      isDiagnosingImage={isDiagnosingImage}
      isSubmittingAnswer={isSubmittingAnswer}
      isCopying={isCopying}
      isConfigDrawerOpen={isConfigDrawerOpen}
      onCreateWorkspace={handleCreateWorkspace}
      onOpenConfigDrawer={() => setIsConfigDrawerOpen(true)}
      onCloseConfigDrawer={() => setIsConfigDrawerOpen(false)}
      onConfigsChanged={handleConfigsChanged}
      onDeleteWorkspace={handleDeleteWorkspace}
      onSelectWorkspace={handleSelectWorkspace}
      onPatchWorkspace={handlePatchWorkspace}
      onGeneratePrompt={handleGeneratePrompt}
      onStopGeneratePrompt={handleStopGeneratePrompt}
      onRefinePrompt={handleRefinePrompt}
      onGenerateImage={handleGenerateImage}
      onStopGenerateImage={handleStopGenerateImage}
      onDiagnoseImage={handleDiagnoseImage}
      onDraftAnswerChange={setDraftAnswer}
      onSubmitAnswer={handleSubmitAnswer}
      onRefineDraftChange={setRefineDraft}
      onCopyPrompt={handleCopyPrompt}
      onClearLogs={() => setLogs([])}
    />
  );
}
