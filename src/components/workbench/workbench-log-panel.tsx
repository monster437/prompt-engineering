"use client";

import React from "react";

export type WorkbenchLogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "success" | "error";
  action: string;
  message: string;
  details?: string;
};

type WorkbenchLogPanelProps = {
  logs: WorkbenchLogEntry[];
  onClearLogs: () => void;
};

const levelStyles: Record<WorkbenchLogEntry["level"], string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700"
};

const levelLabels: Record<WorkbenchLogEntry["level"], string> = {
  info: "信息",
  success: "成功",
  error: "错误"
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function WorkbenchLogPanel({ logs, onClearLogs }: WorkbenchLogPanelProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">操作日志</h2>
          <p className="text-xs text-slate-500">记录前端发起的关键操作、成功结果与失败原因。</p>
        </div>
        <button
          type="button"
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          清空日志
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          暂时还没有日志。
        </p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {logs.map((log) => (
            <article key={log.id} className={`rounded-lg border p-3 text-sm ${levelStyles[log.level]}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-current px-2 py-0.5 text-xs">
                      {levelLabels[log.level]}
                    </span>
                    <span className="font-medium">{log.action}</span>
                  </div>
                  <p>{log.message}</p>
                </div>
                <time className="shrink-0 text-xs opacity-80">{formatTimestamp(log.timestamp)}</time>
              </div>

              {log.details ? (
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-white/70 p-2 text-xs text-slate-700">
                  {log.details}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
