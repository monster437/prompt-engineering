"use client";

import React from "react";
import type { ConfigKind, ProviderModel } from "@/lib/types";

import { ModelListEditor } from "./model-list-editor";

export type ConfigFormValue = {
  type: ConfigKind;
  providerName: string;
  baseURL: string;
  apiKey: string;
  models: ProviderModel[];
};

type ConfigFormProps = {
  value: ConfigFormValue;
  apiKeyMasked: string | null;
  isEditing: boolean;
  isSaving: boolean;
  onChange: (nextValue: ConfigFormValue) => void;
  onSubmit: () => void;
};

export function ConfigForm({
  value,
  apiKeyMasked,
  isEditing,
  isSaving,
  onChange,
  onSubmit
}: ConfigFormProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">配置编辑区</h2>
        <span className="text-xs text-slate-500">{isSaving ? "保存中..." : isEditing ? "编辑模式" : "新建模式"}</span>
      </div>

      <div className="grid gap-4">
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-medium">配置类型</span>
          <select
            value={value.type}
            onChange={(event) => onChange({ ...value, type: event.target.value as ConfigKind })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="text">文本模型</option>
            <option value="image">图像模型</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-medium">Provider 名称</span>
          <input
            type="text"
            value={value.providerName}
            onChange={(event) => onChange({ ...value, providerName: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-medium">Base URL</span>
          <input
            type="text"
            value={value.baseURL}
            placeholder="例如：https://api.openai.com/v1"
            onChange={(event) => onChange({ ...value, baseURL: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-medium">API Key</span>
          {isEditing && apiKeyMasked ? (
            <p className="text-xs text-slate-500">当前密钥：{apiKeyMasked}</p>
          ) : null}
          <input
            type="password"
            value={value.apiKey}
            placeholder={isEditing ? "留空则保留当前密钥" : "请输入 API Key"}
            onChange={(event) => onChange({ ...value, apiKey: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <ModelListEditor
          models={value.models}
          onChange={(models) => onChange({ ...value, models })}
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSaving ? "保存中..." : isEditing ? "保存配置" : "创建配置"}
        </button>
      </div>
    </section>
  );
}
