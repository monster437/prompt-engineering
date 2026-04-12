"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ModelOptionDto, PromptResult, PromptSummary, WorkspaceDto } from "@/lib/types";
import {
  createWorkspace,
  deleteWorkspace,
  generatePrompt,
  listModelOptions,
  listWorkspaces,
  refinePrompt,
  updateWorkspace
} from "@/lib/workbench-client";

import { WorkbenchShell } from "./workbench-shell";

function applyPromptResult(workspace: WorkspaceDto, result: PromptResult): WorkspaceDto {
  if (result.status === "needs_clarification") {
    return {
      ...workspace,
      questionMessages: result.question ? [...workspace.questionMessages, result.question] : workspace.questionMessages,
      status: "asking"
    };
  }

  return {
    ...workspace,
    finalPrompt: result.finalPrompt ?? workspace.finalPrompt,
    parameterSummary: (result.summary as PromptSummary | undefined) ?? workspace.parameterSummary,
    status: "idle"
  };
}

export function WorkbenchPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOptionDto[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [refineDraft, setRefineDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingWorkspaceId, setIsDeletingWorkspaceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    void Promise.all([listWorkspaces(), listModelOptions()]).then(([loadedWorkspaces, loadedModels]) => {
      setWorkspaces(loadedWorkspaces);
      setModelOptions(loadedModels);
      setActiveWorkspaceId((current) => current ?? loadedWorkspaces[0]?.id ?? null);
    });
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  const pendingQuestion = activeWorkspace
    ? activeWorkspace.questionMessages[activeWorkspace.answers.length] ?? null
    : null;

  async function syncWorkspace(next: WorkspaceDto) {
    setWorkspaces((current) => current.map((workspace) => (workspace.id === next.id ? next : workspace)));
    const saved = await updateWorkspace(next.id, next);
    setWorkspaces((current) => current.map((workspace) => (workspace.id === saved.id ? saved : workspace)));
  }

  async function handleCreateWorkspace() {
    setIsCreating(true);
    try {
      const created = await createWorkspace({ title: `Workspace ${workspaces.length + 1}` });
      setWorkspaces((current) => [...current, created]);
      setActiveWorkspaceId(created.id);
      setDraftAnswer("");
      setRefineDraft("");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    setIsDeletingWorkspaceId(workspaceId);
    try {
      await deleteWorkspace(workspaceId);
      setWorkspaces((current) => current.filter((workspace) => workspace.id !== workspaceId));
      setActiveWorkspaceId((current) => (current === workspaceId ? workspaces.find((workspace) => workspace.id !== workspaceId)?.id ?? null : current));
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
    setIsSaving(true);
    try {
      const next = { ...activeWorkspace, ...patch };
      await syncWorkspace(next);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGeneratePrompt() {
    if (!activeWorkspace || !activeWorkspace.selectedTextConfig || !activeWorkspace.selectedTextModel) return;
    setIsGenerating(true);
    try {
      const result = await generatePrompt({
        workspaceId: activeWorkspace.id,
        selectedConfigId: activeWorkspace.selectedTextConfig,
        selectedTextModel: activeWorkspace.selectedTextModel,
        sourcePrompt: activeWorkspace.sourcePrompt
      });
      await syncWorkspace(applyPromptResult(activeWorkspace, result));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefinePrompt() {
    if (!activeWorkspace || !activeWorkspace.selectedTextConfig || !activeWorkspace.selectedTextModel || !refineDraft.trim()) return;
    setIsRefining(true);
    try {
      const result = await refinePrompt({
        workspaceId: activeWorkspace.id,
        selectedConfigId: activeWorkspace.selectedTextConfig,
        selectedTextModel: activeWorkspace.selectedTextModel,
        refineInstruction: refineDraft.trim()
      });
      await syncWorkspace({
        ...applyPromptResult(activeWorkspace, result),
        refineInstruction: refineDraft.trim()
      });
    } finally {
      setIsRefining(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!activeWorkspace || !pendingQuestion || !draftAnswer.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      const nextAnswers = [...activeWorkspace.answers, draftAnswer.trim()];
      await syncWorkspace({ ...activeWorkspace, answers: nextAnswers, status: "idle" });
      setDraftAnswer("");
    } finally {
      setIsSubmittingAnswer(false);
    }
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

  return (
    <WorkbenchShell
      workspaces={workspaces}
      activeWorkspaceId={activeWorkspaceId}
      modelOptions={modelOptions}
      pendingQuestion={pendingQuestion}
      draftAnswer={draftAnswer}
      refineDraft={refineDraft}
      isCreating={isCreating}
      isDeletingWorkspaceId={isDeletingWorkspaceId}
      isSaving={isSaving}
      isGenerating={isGenerating}
      isRefining={isRefining}
      isSubmittingAnswer={isSubmittingAnswer}
      isCopying={isCopying}
      onCreateWorkspace={handleCreateWorkspace}
      onDeleteWorkspace={handleDeleteWorkspace}
      onSelectWorkspace={handleSelectWorkspace}
      onPatchWorkspace={handlePatchWorkspace}
      onGeneratePrompt={handleGeneratePrompt}
      onRefinePrompt={handleRefinePrompt}
      onDraftAnswerChange={setDraftAnswer}
      onSubmitAnswer={handleSubmitAnswer}
      onRefineDraftChange={setRefineDraft}
      onCopyPrompt={handleCopyPrompt}
    />
  );
}
