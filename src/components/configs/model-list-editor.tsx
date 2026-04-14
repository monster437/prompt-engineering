"use client";

import React from "react";
import type { ProviderModel } from "@/lib/types";

type ModelListEditorProps = {
  models: ProviderModel[];
  onChange: (models: ProviderModel[]) => void;
};

function updateModel(models: ProviderModel[], index: number, patch: Partial<ProviderModel>) {
  return models.map((model, currentIndex) =>
    currentIndex === index ? { ...model, ...patch } : model
  );
}

export function ModelListEditor({ models, onChange }: ModelListEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-900">模型列表</h3>
        <button
          type="button"
          onClick={() => onChange([...models, { modelName: "", label: "", providerId: "" }])}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
        >
          添加模型
        </button>
      </div>

      {models.map((model, index) => (
        <div key={`${index}-${model.modelName}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">显示名称</span>
            <input
              type="text"
              value={model.label}
              onChange={(event) => onChange(updateModel(models, index, { label: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">模型名</span>
            <input
              type="text"
              value={model.modelName}
              onChange={(event) => onChange(updateModel(models, index, { modelName: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Provider ID（可选）</span>
            <input
              type="text"
              value={model.providerId ?? ""}
              onChange={(event) => onChange(updateModel(models, index, { providerId: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => onChange(models.filter((_, currentIndex) => currentIndex !== index))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-3"
          >
            删除模型
          </button>
        </div>
      ))}
    </div>
  );
}
