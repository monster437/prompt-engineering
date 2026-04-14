"use client";

import React from "react";
import type { WorkspaceDto } from "@/lib/types";

type PromptResultPanelProps = {
  workspace: WorkspaceDto;
  refineDraft: string;
  isCopying: boolean;
  onRefineDraftChange: (value: string) => void;
  onCopyPrompt: () => void;
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
  isCopying,
  onRefineDraftChange,
  onCopyPrompt
}: PromptResultPanelProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">结果区</h2>
        <button
          type="button"
          onClick={onCopyPrompt}
          disabled={!workspace.finalPrompt || isCopying}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isCopying ? "复制中..." : "复制提示词"}
        </button>
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
