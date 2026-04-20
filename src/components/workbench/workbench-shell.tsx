"use client";

import React from "react";
import Link from "next/link";
import type { GenerateImageResult, ModelOptionDto, WorkspaceDto } from "@/lib/types";
import { ConfigsManager } from "@/components/configs/configs-manager";

import { ConfigDrawer } from "./config-drawer";
import { FollowUpPanel } from "./follow-up-panel";
import { PromptResultPanel } from "./prompt-result-panel";
import { WorkbenchLogPanel, type WorkbenchLogEntry } from "./workbench-log-panel";
import { WorkspaceEditor } from "./workspace-editor";
import { WorkspaceList, type WorkspaceActivityState } from "./workspace-list";

type WorkbenchShellProps = {
  workspaces: WorkspaceDto[];
  activeWorkspaceId: string | null;
  modelOptions: ModelOptionDto[];
  workspaceActivityById: Record<string, WorkspaceActivityState>;
  pendingQuestion: string | null;
  draftAnswer: string;
  refineDraft: string;
  imageResult: GenerateImageResult | null;
  logs?: WorkbenchLogEntry[];
  errorMessage: string | null;
  isCreating: boolean;
  isDeletingWorkspaceId: string | null;
  isSaving: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  isGeneratingImage: boolean;
  isDiagnosingImage: boolean;
  isSubmittingAnswer: boolean;
  isCopying: boolean;
  isConfigDrawerOpen: boolean;
  onCreateWorkspace: () => void;
  onOpenConfigDrawer: () => void;
  onCloseConfigDrawer: () => void;
  onConfigsChanged: () => void | Promise<void>;
  onDeleteWorkspace: (workspaceId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onPatchWorkspace: (patch: Partial<WorkspaceDto>) => void;
  onGeneratePrompt: () => void;
  onStopGeneratePrompt: () => void;
  onRefinePrompt: () => void;
  onGenerateImage: () => void;
  onStopGenerateImage: () => void;
  onDiagnoseImage: () => void;
  onDraftAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onRefineDraftChange: (value: string) => void;
  onCopyPrompt: () => void;
  onClearLogs?: () => void;
};

export function WorkbenchShell({
  workspaces,
  activeWorkspaceId,
  modelOptions,
  workspaceActivityById,
  pendingQuestion,
  draftAnswer,
  refineDraft,
  imageResult,
  logs = [],
  errorMessage,
  isCreating,
  isDeletingWorkspaceId,
  isSaving,
  isGenerating,
  isRefining,
  isGeneratingImage,
  isDiagnosingImage,
  isSubmittingAnswer,
  isCopying,
  isConfigDrawerOpen,
  onCreateWorkspace,
  onOpenConfigDrawer,
  onCloseConfigDrawer,
  onConfigsChanged,
  onDeleteWorkspace,
  onSelectWorkspace,
  onPatchWorkspace,
  onGeneratePrompt,
  onStopGeneratePrompt,
  onRefinePrompt,
  onGenerateImage,
  onStopGenerateImage,
  onDiagnoseImage,
  onDraftAnswerChange,
  onSubmitAnswer,
  onRefineDraftChange,
  onCopyPrompt,
  onClearLogs = () => undefined
}: WorkbenchShellProps) {
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const activeImageOption =
    activeWorkspace?.selectedImageConfig && activeWorkspace?.selectedImageModel
      ? modelOptions.find(
          (option) =>
            option.configType === "image" &&
            option.configId === activeWorkspace.selectedImageConfig &&
            option.modelName === activeWorkspace.selectedImageModel
        ) ?? null
      : null;
  const canGenerateImage = Boolean(activeWorkspace?.finalPrompt?.trim() && activeImageOption);
  const canDiagnoseImage = Boolean(activeWorkspace?.selectedImageConfig && activeWorkspace?.selectedImageModel);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">提示词工作台</h1>
            <p className="text-sm text-slate-600">在一个页面中创建、追问、优化并管理图像提示词。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reverse"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              图片逆推
            </Link>
            <button
              type="button"
              onClick={onOpenConfigDrawer}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              管理模型配置
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start xl:grid-cols-[300px_minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <aside className="min-w-0">
            <WorkspaceList
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              workspaceActivityById={workspaceActivityById}
              isCreating={isCreating}
              deletingWorkspaceId={isDeletingWorkspaceId}
              onCreateWorkspace={onCreateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
              onSelectWorkspace={onSelectWorkspace}
            />
          </aside>

          {activeWorkspace ? (
            [
              <section key="editor-column" className="min-w-0 space-y-6">
                <WorkspaceEditor
                  workspace={activeWorkspace}
                  modelOptions={modelOptions}
                  isSaving={isSaving}
                  isGenerating={isGenerating}
                  isRefining={isRefining}
                  onPatchWorkspace={onPatchWorkspace}
                  onGeneratePrompt={onGeneratePrompt}
                  onStopGeneratePrompt={onStopGeneratePrompt}
                  onRefinePrompt={onRefinePrompt}
                />
                {errorMessage ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}
                <FollowUpPanel
                  workspace={activeWorkspace}
                  pendingQuestion={pendingQuestion}
                  draftAnswer={draftAnswer}
                  isSubmittingAnswer={isSubmittingAnswer}
                  onDraftAnswerChange={onDraftAnswerChange}
                  onSubmitAnswer={onSubmitAnswer}
                />
                <WorkbenchLogPanel logs={logs} onClearLogs={onClearLogs} />
              </section>,

              <section key="result-column" className="min-w-0">
                <PromptResultPanel
                  workspace={activeWorkspace}
                  refineDraft={refineDraft}
                  imageResult={imageResult}
                  isCopying={isCopying}
                  isGeneratingImage={isGeneratingImage}
                  isDiagnosingImage={isDiagnosingImage}
                  canGenerateImage={canGenerateImage}
                  canDiagnoseImage={canDiagnoseImage}
                  onRefineDraftChange={onRefineDraftChange}
                  onCopyPrompt={onCopyPrompt}
                  onGenerateImage={onGenerateImage}
                  onStopGenerateImage={onStopGenerateImage}
                  onDiagnoseImage={onDiagnoseImage}
                />
              </section>
            ]
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 lg:col-span-2">
              请选择一个工作台，或先创建一个新的工作台。
            </section>
          )}
        </div>
      </div>
      <ConfigDrawer isOpen={isConfigDrawerOpen} onClose={onCloseConfigDrawer}>
        <ConfigsManager onConfigsChanged={onConfigsChanged} />
      </ConfigDrawer>
    </main>
  );
}
