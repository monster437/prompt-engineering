import { describe, expect, it, vi } from "vitest";

import { WorkbenchLogPanel } from "./workbench-log-panel";

describe("WorkbenchLogPanel", () => {
  it("shows empty state when there are no logs", () => {
    const html = WorkbenchLogPanel({
      logs: [],
      onClearLogs: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("暂时还没有日志。");
  });

  it("renders log entries and clear action", () => {
    const onClearLogs = vi.fn();
    const html = WorkbenchLogPanel({
      logs: [
        {
          id: "log_1",
          timestamp: "2026-04-15T12:00:00.000Z",
          level: "error",
          action: "生成图片",
          message: "fetch failed",
          details: "workspaceId: ws_1\nselectedImageModel: grok-image"
        }
      ],
      onClearLogs
    });

    const output = JSON.stringify(html);

    expect(output).toContain("操作日志");
    expect(output).toContain("生成图片");
    expect(output).toContain("fetch failed");
    expect(output).toContain("selectedImageModel: grok-image");

    const header = html.props.children[0];
    const clearButton = header.props.children[1];
    clearButton.props.onClick();

    expect(onClearLogs).toHaveBeenCalledTimes(1);
  });
});
