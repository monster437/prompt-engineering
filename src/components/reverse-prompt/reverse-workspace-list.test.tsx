import { describe, expect, it, vi } from "vitest";
import React from "react";

import { ReverseWorkspaceList } from "./reverse-workspace-list";

describe("ReverseWorkspaceList", () => {
  it("renders workspace items and status badges", () => {
    const html = ReverseWorkspaceList({
      workspaces: [
        {
          id: "rw_1",
          title: "逆推工作台 1",
          status: "generating",
          imageCount: 2,
          hasResult: false
        },
        {
          id: "rw_2",
          title: "逆推工作台 2",
          status: "completed",
          imageCount: 1,
          hasResult: true
        }
      ],
      activeWorkspaceId: "rw_2",
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("逆推工作台");
    expect(output).toContain("逆推工作台 1");
    expect(output).toContain("逆推中");
    expect(output).toContain("已完成");
    expect(output).toContain('"children":["图片 ",2," 张"]');
    expect(output).toContain("有结果");
  });

  it("exposes create, select, and delete handlers", () => {
    const onCreateWorkspace = vi.fn();
    const onDeleteWorkspace = vi.fn();
    const onSelectWorkspace = vi.fn();

    const html = ReverseWorkspaceList({
      workspaces: [
        {
          id: "rw_1",
          title: "逆推工作台 1",
          status: "idle",
          imageCount: 0,
          hasResult: false
        }
      ],
      activeWorkspaceId: null,
      onCreateWorkspace,
      onDeleteWorkspace,
      onSelectWorkspace
    });

    const bodyChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const createButton = bodyChildren[0].props.children[1];
    const rows = React.Children.toArray(bodyChildren[1].props.children) as React.ReactElement<any>[];
    const row = rows[0];
    const selectButton = row.props.children[0];
    const deleteButton = row.props.children[1];

    createButton.props.onClick();
    selectButton.props.onClick();
    deleteButton.props.onClick();

    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    expect(onSelectWorkspace).toHaveBeenCalledWith("rw_1");
    expect(onDeleteWorkspace).toHaveBeenCalledWith("rw_1");
  });
});
