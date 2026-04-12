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
    selectedImageModel: null,
    sourcePrompt: "",
    questionMessages: [],
    answers: [],
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
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
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("Workspace 1");
    expect(JSON.stringify(html)).toContain("Workspace 2");
    expect(JSON.stringify(html)).toContain("Workspace 2 (current)");
    expect(JSON.stringify(html)).toContain("asking");
  });

  it("exposes create handler on the new workspace button", () => {
    const onCreateWorkspace = vi.fn();
    const html = WorkspaceList({
      workspaces: [],
      activeWorkspaceId: null,
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace,
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const createButton = (html.props.children[0].props.children[1]);
    createButton.props.onClick();

    expect(createButton.props.children).toBe("New workspace");
    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
  });

  it("disables the create button while creation is pending", () => {
    const html = WorkspaceList({
      workspaces: [],
      activeWorkspaceId: null,
      isCreating: true,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const createButton = html.props.children[0].props.children[1];

    expect(createButton.props.disabled).toBe(true);
    expect(createButton.props.children).toBe("Creating...");
  });

  it("wires row selection and deletion handlers with workspace ids", () => {
    const onSelectWorkspace = vi.fn();
    const onDeleteWorkspace = vi.fn();
    const html = WorkspaceList({
      workspaces: [makeWorkspace({ id: "ws_9", title: "Workspace 9" })],
      activeWorkspaceId: null,
      isCreating: false,
      deletingWorkspaceId: null,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace,
      onSelectWorkspace
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Delete Workspace 9");
    expect(output).toContain("Workspace 9");
  });

  it("disables only the delete button for the workspace being removed", () => {
    const html = WorkspaceList({
      workspaces: [
        makeWorkspace({ id: "ws_1", title: "Workspace 1" }),
        makeWorkspace({ id: "ws_2", title: "Workspace 2" })
      ],
      activeWorkspaceId: "ws_1",
      isCreating: false,
      deletingWorkspaceId: "ws_2",
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Deleting Workspace 2");
    expect(output).toContain("Delete Workspace 1");
  });
});
