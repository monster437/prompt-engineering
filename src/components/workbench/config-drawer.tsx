"use client";

import Link from "next/link";
import React from "react";

type ConfigDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ConfigDrawer({ isOpen, onClose, children }: ConfigDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="关闭配置抽屉"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />
      <aside className="relative ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">模型配置抽屉</h2>
            <p className="text-sm text-slate-600">在不离开工作台的情况下管理模型配置，保存后会自动刷新模型选项。</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/configs" target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
              独立页打开
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}
