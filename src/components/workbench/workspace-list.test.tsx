import { describe, expect, it, vi } from "vitest";

import type { WorkspaceDto } from "@/lib/types";

import { WorkspaceList } from "./workspace-list";

function makeWorkspace(overrides: Partial<WorkspaceDto> = {}): WorkspaceDto {
  return {
    id: "ws_1",
    title: "Workspace 1",
    mode: "interview",
    outputLanguage: "zh",
    selectedTextModel: null,
    selectedTextConfig: null,
    selectedTargetType: "general",
    selectedImageConfig: null,
    selectedImageAspectRatio: "auto",
    selectedImageModel: null,
    sourcePrompt: "",
    sourcePromptImages: [],
    questionMessages: [],
    answers: [],
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
    generatedImageResult: null,
    status: "idle",
    ...overrides
  };
}

describe("WorkspaceList", () => {
  it("renders all workspace titles and active state text", () => {
    const html = WorkspaceList({
      workspaces: [
        makeWorkspace({ id: "ws_1", title: "Workspace 1" }),
        makeWorkspace({ id: "ws_2", title: "Workspace 2", status: "asking" })
      ],
      activeWorkspaceId: "ws_2",
      workspaceActivityById: {
        ws_1: "generating",
        ws_2: "asking"
      },
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("Workspace 1");
    expect(JSON.stringify(html)).toContain("Workspace 2");
    expect(JSON.stringify(html)).toContain("Workspace 2（当前）");
    expect(JSON.stringify(html)).toContain("生成中");
    expect(JSON.stringify(html)).toContain("等待回答");
  });

  it("exposes create handler on the new workspace button", () => {
    const onCreateWorkspace = vi.fn();
    const html = WorkspaceList({
      workspaces: [],
      activeWorkspaceId: null,
      workspaceActivityById: {},
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace,
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const createButton = (html.props.children[0].props.children[1]);
    createButton.props.onClick();

    expect(createButton.props.children).toBe("新建工作台");
    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
  });

  it("disables the create button while creation is pending", () => {
    const html = WorkspaceList({
      workspaces: [],
      activeWorkspaceId: null,
      workspaceActivityById: {},
      isCreating: true,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const createButton = html.props.children[0].props.children[1];

    expect(createButton.props.disabled).toBe(true);
    expect(createButton.props.children).toBe("创建中...");
  });

  it("wires row selection and deletion handlers with workspace ids", () => {
    const onSelectWorkspace = vi.fn();
    const onDeleteWorkspace = vi.fn();
    const html = WorkspaceList({
      workspaces: [makeWorkspace({ id: "ws_9", title: "Workspace 9" })],
      activeWorkspaceId: null,
      workspaceActivityById: { ws_9: "idle" },
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace,
      onSelectWorkspace
    });

    const output = JSON.stringify(html);

    expect(output).toContain("删除 Workspace 9");
    expect(output).toContain("Workspace 9");
  });

  it("disables only the delete button for the workspace being removed", () => {
    const html = WorkspaceList({
      workspaces: [
        makeWorkspace({ id: "ws_1", title: "Workspace 1" }),
        makeWorkspace({ id: "ws_2", title: "Workspace 2" })
      ],
      activeWorkspaceId: "ws_1",
      workspaceActivityById: {
        ws_1: "refining",
        ws_2: "generating_image"
      },
      isCreating: false,
      deletingWorkspaceId: "ws_2",
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("正在删除 Workspace 2");
    expect(output).toContain("删除 Workspace 1");
    expect(output).toContain("优化中");
    expect(output).toContain("出图中");
  });
});
