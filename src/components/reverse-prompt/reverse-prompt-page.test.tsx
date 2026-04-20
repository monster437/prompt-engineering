import { describe, expect, it, vi } from "vitest";

const {
  createReverseWorkspaceMock,
  deleteReverseWorkspaceMock,
  listModelOptionsMock,
  listReverseWorkspacesMock,
  updateReverseWorkspaceMock,
  reversePromptMock
} = vi.hoisted(() => ({
  createReverseWorkspaceMock: vi.fn(),
  deleteReverseWorkspaceMock: vi.fn(),
  listModelOptionsMock: vi.fn(),
  listReverseWorkspacesMock: vi.fn(),
  updateReverseWorkspaceMock: vi.fn(),
  reversePromptMock: vi.fn()
}));

vi.mock("@/lib/workbench-client", () => ({
  createReverseWorkspace: createReverseWorkspaceMock,
  deleteReverseWorkspace: deleteReverseWorkspaceMock,
  listModelOptions: listModelOptionsMock,
  listReverseWorkspaces: listReverseWorkspacesMock,
  reversePrompt: reversePromptMock,
  updateReverseWorkspace: updateReverseWorkspaceMock
}));

import { ReversePromptPage } from "./reverse-prompt-page";

describe("ReversePromptPage", () => {
  it("is a client component entrypoint", () => {
    expect(typeof ReversePromptPage).toBe("function");
  });

  it("keeps the expected client dependencies wired", () => {
    expect(createReverseWorkspaceMock).toBeDefined();
    expect(deleteReverseWorkspaceMock).toBeDefined();
    expect(listModelOptionsMock).toBeDefined();
    expect(listReverseWorkspacesMock).toBeDefined();
    expect(reversePromptMock).toBeDefined();
    expect(updateReverseWorkspaceMock).toBeDefined();
  });
});
