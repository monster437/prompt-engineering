"use client";

import React from "react";
import Link from "next/link";
import type { ProviderConfigDto } from "@/lib/types";

import type { ConfigFormValue } from "./config-form";
import { ConfigForm } from "./config-form";
import { ConfigList } from "./config-list";

type ConfigsShellProps = {
  configs: ProviderConfigDto[];
  activeConfigId: string | null;
  deletingConfigId: string | null;
  formValue: ConfigFormValue;
  apiKeyMasked: string | null;
  isEditing: boolean;
  isSaving: boolean;
  onCreateNew: () => void;
  onSelectConfig: (configId: string) => void;
  onDeleteConfig: (configId: string) => void;
  onFormChange: (nextValue: ConfigFormValue) => void;
  onSubmit: () => void;
};

export function ConfigsShell({
  configs,
  activeConfigId,
  deletingConfigId,
  formValue,
  apiKeyMasked,
  isEditing,
  isSaving,
  onCreateNew,
  onSelectConfig,
  onDeleteConfig,
  onFormChange,
  onSubmit
}: ConfigsShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">AI 模型配置管理</h1>
            <p className="text-sm text-slate-600">管理文本模型、图像模型、Provider 和 API Key 配置。</p>
          </div>
          <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            返回工作台
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ConfigList
            configs={configs}
            activeConfigId={activeConfigId}
            deletingConfigId={deletingConfigId}
            onCreateNew={onCreateNew}
            onSelectConfig={onSelectConfig}
            onDeleteConfig={onDeleteConfig}
          />

          <ConfigForm
            value={formValue}
            apiKeyMasked={apiKeyMasked}
            isEditing={isEditing}
            isSaving={isSaving}
            onChange={onFormChange}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </main>
  );
}
