"use client";

import Link from "next/link";
import React from "react";
import type { ModelOptionDto, OutputLanguage, WorkspaceDto, WorkspaceMode } from "@/lib/types";

type WorkspaceEditorProps = {
  workspace: WorkspaceDto;
  modelOptions: ModelOptionDto[];
  isSaving: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  onPatchWorkspace: (patch: Partial<WorkspaceDto>) => void;
  onGeneratePrompt: () => void;
  onRefinePrompt: () => void;
};

const modes: WorkspaceMode[] = ["interview", "optimize"];
const languages: OutputLanguage[] = ["zh", "en"];

export function WorkspaceEditor({
  workspace,
  modelOptions,
  isSaving,
  isGenerating,
  isRefining,
  onPatchWorkspace,
  onGeneratePrompt,
  onRefinePrompt
}: WorkspaceEditorProps) {
  const textModels = modelOptions.filter((option) => option.configType === "text");
  const imageModels = modelOptions.filter((option) => option.configType === "image");
  const hasModelOptions = modelOptions.length > 0;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">工作台编辑区</h2>
        <span className="text-xs text-slate-500">{isSaving ? "保存中..." : "就绪"}</span>
      </div>

      {!hasModelOptions ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          暂无可用模型配置，请先前往
          <Link href="/configs" className="mx-1 font-medium text-slate-900 underline">
            配置管理页
          </Link>
          添加文本模型或图像模型。
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">模式</span>
          <select
            value={workspace.mode}
            onChange={(event) => onPatchWorkspace({ mode: event.target.value as WorkspaceMode })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">输出语言</span>
          <select
            value={workspace.outputLanguage}
            onChange={(event) => onPatchWorkspace({ outputLanguage: event.target.value as OutputLanguage })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">目标类型</span>
          <input
            type="text"
            value={workspace.selectedTargetType}
            onChange={(event) => onPatchWorkspace({ selectedTargetType: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">文本模型</span>
          <select
            value={workspace.selectedTextConfig ?? ""}
            onChange={(event) => {
              const selected = textModels.find((option) => option.configId === event.target.value);
              onPatchWorkspace({
                selectedTextConfig: selected?.configId ?? null,
                selectedTextModel: selected?.modelName ?? null
              });
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">请选择文本模型</option>
            {textModels.map((option) => (
              <option key={`${option.configId}:${option.modelName}`} value={option.configId}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">图像模型</span>
          <select
            value={workspace.selectedImageModel ?? ""}
            onChange={(event) => onPatchWorkspace({ selectedImageModel: event.target.value || null })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">请选择图像模型</option>
            {imageModels.map((option) => (
              <option key={`${option.configId}:${option.modelName}`} value={option.modelName}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-700">
          <span className="font-medium">原始提示词</span>
          <textarea
            value={workspace.sourcePrompt}
            onChange={(event) => onPatchWorkspace({ sourcePrompt: event.target.value })}
            className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGeneratePrompt}
            disabled={isGenerating}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGenerating ? "生成中..." : "生成提示词"}
          </button>
          <button
            type="button"
            onClick={onRefinePrompt}
            disabled={isRefining}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isRefining ? "优化中..." : "优化提示词"}
          </button>
        </div>
      </div>
    </section>
  );
}
