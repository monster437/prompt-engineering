"use client";

import React from "react";
import type { WorkspaceDto } from "@/lib/types";

type WorkspaceListProps = {
  workspaces: WorkspaceDto[];
  activeWorkspaceId: string | null;
  isCreating: boolean;
  deletingWorkspaceId: string | null;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
};

export function WorkspaceList({
  workspaces,
  activeWorkspaceId,
  isCreating,
  deletingWorkspaceId,
  onCreateWorkspace,
  onDeleteWorkspace,
  onSelectWorkspace
}: WorkspaceListProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Workspaces</h2>
        <button
          type="button"
          onClick={onCreateWorkspace}
          disabled={isCreating}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isCreating ? "Creating..." : "New workspace"}
        </button>
      </div>

      <div className="space-y-2">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          const isDeleting = workspace.id === deletingWorkspaceId;

          return (
            <div
              key={workspace.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2"
            >
              <button
                type="button"
                onClick={() => onSelectWorkspace(workspace.id)}
                className="flex-1 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-900"
                aria-pressed={isActive}
                aria-label={isActive ? `${workspace.title} (current)` : workspace.title}
              >
                <span className="block">{workspace.title}</span>
                <span className="block text-xs text-slate-500">
                  {workspace.mode} · {workspace.status}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteWorkspace(workspace.id)}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                aria-label={isDeleting ? `Deleting ${workspace.title}` : `Delete ${workspace.title}`}
              >
                Delete
              </button>
            </div>
          );
        })}

        {workspaces.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            No workspaces yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
