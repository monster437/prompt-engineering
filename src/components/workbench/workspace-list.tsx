"use client";

import React from "react";
import type { WorkspaceDto } from "@/lib/types";

export type WorkspaceActivityState =
  | "idle"
  | "saving"
  | "generating"
  | "refining"
  | "generating_image"
  | "diagnosing_image"
  | "submitting_answer"
  | "asking"
  | "error";

type WorkspaceListProps = {
  workspaces: WorkspaceDto[];
  activeWorkspaceId: string | null;
  workspaceActivityById?: Record<string, WorkspaceActivityState>;
  isCreating: boolean;
  deletingWorkspaceId: string | null;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
};

export function WorkspaceList({
  workspaces,
  activeWorkspaceId,
  workspaceActivityById = {},
  isCreating,
  deletingWorkspaceId,
  onCreateWorkspace,
  onDeleteWorkspace,
  onSelectWorkspace
}: WorkspaceListProps) {
  function getBadgeMeta(activity: WorkspaceActivityState) {
    switch (activity) {
      case "saving":
        return { label: "保存中", className: "bg-slate-100 text-slate-700 border-slate-200" };
      case "generating":
        return { label: "生成中", className: "bg-blue-50 text-blue-700 border-blue-200" };
      case "refining":
        return { label: "优化中", className: "bg-amber-50 text-amber-700 border-amber-200" };
      case "generating_image":
        return { label: "出图中", className: "bg-violet-50 text-violet-700 border-violet-200" };
      case "diagnosing_image":
        return { label: "测试通道中", className: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "submitting_answer":
        return { label: "提交回答中", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "asking":
        return { label: "等待回答", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "error":
        return { label: "出错", className: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: "空闲", className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">工作台列表</h2>
        <button
          type="button"
          onClick={onCreateWorkspace}
          disabled={isCreating}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isCreating ? "创建中..." : "新建工作台"}
        </button>
      </div>

      <div className="space-y-2">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          const isDeleting = workspace.id === deletingWorkspaceId;
          const activity = workspaceActivityById[workspace.id] ?? (workspace.status === "asking" ? "asking" : workspace.status === "error" ? "error" : "idle");
          const badge = getBadgeMeta(activity);
          const modeLabel = workspace.mode === "interview" ? "访谈模式" : "优化模式";

          return (
            <div
              key={workspace.id}
              className={isActive ? "flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-50 p-2" : "flex items-center gap-2 rounded-lg border border-slate-200 p-2"}
            >
              <button
                type="button"
                onClick={() => onSelectWorkspace(workspace.id)}
                className="flex-1 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-900"
                aria-pressed={isActive}
                aria-label={isActive ? `${workspace.title}（当前）` : workspace.title}
              >
                <span className="block">{workspace.title}</span>
                <span className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                    {modeLabel}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${badge.className}`}>
                    {badge.label}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteWorkspace(workspace.id)}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                aria-label={isDeleting ? `正在删除 ${workspace.title}` : `删除 ${workspace.title}`}
              >
                删除
              </button>
            </div>
          );
        })}

        {workspaces.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            还没有工作台。
          </p>
        ) : null}
      </div>
    </section>
  );
}
