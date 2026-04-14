"use client";

import React from "react";
import type { ProviderConfigDto } from "@/lib/types";

type ConfigListProps = {
  configs: ProviderConfigDto[];
  activeConfigId: string | null;
  deletingConfigId: string | null;
  onCreateNew: () => void;
  onSelectConfig: (configId: string) => void;
  onDeleteConfig: (configId: string) => void;
};

export function ConfigList({
  configs,
  activeConfigId,
  deletingConfigId,
  onCreateNew,
  onSelectConfig,
  onDeleteConfig
}: ConfigListProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">配置列表</h2>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          新建配置
        </button>
      </div>

      <div className="space-y-2">
        {configs.map((config) => {
          const isActive = config.id === activeConfigId;
          const isDeleting = config.id === deletingConfigId;

          return (
            <div key={config.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
              <button
                type="button"
                onClick={() => onSelectConfig(config.id)}
                className="flex-1 rounded-md px-3 py-2 text-left"
                aria-pressed={isActive}
                aria-label={isActive ? `${config.providerName}（当前）` : config.providerName}
              >
                <span className="block text-sm font-medium text-slate-900">{config.providerName}</span>
                <span className="block text-xs text-slate-500">{config.type} · {config.models.length} 个模型</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteConfig(config.id)}
                disabled={isDeleting}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isDeleting ? "删除中..." : "删除"}
              </button>
            </div>
          );
        })}

        {configs.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
            还没有任何模型配置。
          </p>
        ) : null}
      </div>
    </section>
  );
}
