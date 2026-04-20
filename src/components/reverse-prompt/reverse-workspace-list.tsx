"use client";

import React from "react";

export type ReverseWorkspaceStatus = "idle" | "generating" | "completed" | "error";

export type ReverseWorkspaceListItem = {
  id: string;
  title: string;
  status: ReverseWorkspaceStatus;
  imageCount: number;
  hasResult: boolean;
};

type ReverseWorkspaceListProps = {
  workspaces: ReverseWorkspaceListItem[];
  activeWorkspaceId: string | null;
  isCreating?: boolean;
  deletingWorkspaceId?: string | null;
  onCreateWorkspace: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
};

export function ReverseWorkspaceList({
  workspaces,
  activeWorkspaceId,
  isCreating = false,
  deletingWorkspaceId = null,
  onCreateWorkspace,
  onDeleteWorkspace,
  onSelectWorkspace
}: ReverseWorkspaceListProps) {
  function getBadgeMeta(status: ReverseWorkspaceStatus) {
    switch (status) {
      case "generating":
        return { label: "逆推中", className: "bg-blue-50 text-blue-700 border-blue-200" };
      case "completed":
        return { label: "已完成", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "error":
        return { label: "出错", className: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: "空闲", className: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">逆推工作台</h2>
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
          const badge = getBadgeMeta(workspace.status);

          return (
            <div
              key={workspace.id}
              className={
                isActive
                  ? "flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-50 p-2"
                  : "flex items-center gap-2 rounded-lg border border-slate-200 p-2"
              }
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
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                    图片 {workspace.imageCount} 张
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                    {workspace.hasResult ? "有结果" : "无结果"}
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
            还没有逆推工作台。
          </p>
        ) : null}
      </div>
    </section>
  );
}
