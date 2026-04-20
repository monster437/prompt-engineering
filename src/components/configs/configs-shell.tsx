"use client";

import React from "react";
import Link from "next/link";

type ConfigsShellProps = {
  children: React.ReactNode;
};

export function ConfigsShell({
  children
}: ConfigsShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">AI 模型配置管理</h1>
            <p className="text-sm text-slate-600">管理文本模型、图像模型、Provider 和 API Key 配置。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
              返回工作台
            </Link>
            <Link href="/reverse" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
              图片逆推
            </Link>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
