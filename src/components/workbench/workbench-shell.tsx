"use client";

import React from "react";
import Link from "next/link";
import type { ModelOptionDto, WorkspaceDto } from "@/lib/types";

import { FollowUpPanel } from "./follow-up-panel";
import { PromptResultPanel } from "./prompt-result-panel";
import { WorkspaceEditor } from "./workspace-editor";
import { WorkspaceList } from "./workspace-list";

type WorkbenchShellProps = {
  workspaces: WorkspaceDto[];
  activeWorkspaceId: string | null;
  modelOptions: ModelOptionDto[];
  pendingQuestion: string | null;
  draftAnswer: string;
  refineDraft: string;
  errorMessage: string | null;
  isCreating: boolean;
  isDeletingWorkspaceId: string | null;
  isSaving: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  isSubmittingAnswer: boolean;
  isCopying: boolean;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onPatchWorkspace: (patch: Partial<WorkspaceDto>) => void;
  onGeneratePrompt: () => void;
  onRefinePrompt: () => void;
  onDraftAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onRefineDraftChange: (value: string) => void;
  onCopyPrompt: () => void;
};

export function WorkbenchShell({
  workspaces,
  activeWorkspaceId,
  modelOptions,
  pendingQuestion,
  draftAnswer,
  refineDraft,
  errorMessage,
  isCreating,
  isDeletingWorkspaceId,
  isSaving,
  isGenerating,
  isRefining,
  isSubmittingAnswer,
  isCopying,
  onCreateWorkspace,
  onDeleteWorkspace,
  onSelectWorkspace,
  onPatchWorkspace,
  onGeneratePrompt,
  onRefinePrompt,
  onDraftAnswerChange,
  onSubmitAnswer,
  onRefineDraftChange,
  onCopyPrompt
}: WorkbenchShellProps) {
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">提示词工作台</h1>
            <p className="text-sm text-slate-600">在一个页面中创建、追问、优化并管理图像提示词。</p>
          </div>
          <Link href="/configs" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            管理模型配置
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <WorkspaceList
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              isCreating={isCreating}
              deletingWorkspaceId={isDeletingWorkspaceId}
              onCreateWorkspace={onCreateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
              onSelectWorkspace={onSelectWorkspace}
            />
          </aside>

          {activeWorkspace ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-6">
                <WorkspaceEditor
                  workspace={activeWorkspace}
                  modelOptions={modelOptions}
                  isSaving={isSaving}
                  isGenerating={isGenerating}
                  isRefining={isRefining}
                  onPatchWorkspace={onPatchWorkspace}
                  onGeneratePrompt={onGeneratePrompt}
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
              </div>

              <PromptResultPanel
                workspace={activeWorkspace}
                refineDraft={refineDraft}
                isCopying={isCopying}
                onRefineDraftChange={onRefineDraftChange}
                onCopyPrompt={onCopyPrompt}
              />
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              请选择一个工作台，或先创建一个新的工作台。
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
