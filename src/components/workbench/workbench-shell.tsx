"use client";

import React from "react";
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
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Image Prompt Workbench</h1>
          <p className="text-sm text-slate-600">Create, interview, refine, and manage image prompts in one place.</p>
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
              Select or create a workspace to begin.
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
