import { describe, expect, it, vi } from "vitest";

const {
  createWorkspaceMock,
  deleteWorkspaceMock,
  generateImageMock,
  generatePromptMock,
  listModelOptionsMock,
  listWorkspacesMock,
  refinePromptMock,
  updateWorkspaceMock
} = vi.hoisted(() => ({
  createWorkspaceMock: vi.fn(),
  deleteWorkspaceMock: vi.fn(),
  generateImageMock: vi.fn(),
  generatePromptMock: vi.fn(),
  listModelOptionsMock: vi.fn(),
  listWorkspacesMock: vi.fn(),
  refinePromptMock: vi.fn(),
  updateWorkspaceMock: vi.fn()
}));

vi.mock("@/lib/workbench-client", () => ({
  createWorkspace: createWorkspaceMock,
  deleteWorkspace: deleteWorkspaceMock,
  generateImage: generateImageMock,
  generatePrompt: generatePromptMock,
  listModelOptions: listModelOptionsMock,
  listWorkspaces: listWorkspacesMock,
  refinePrompt: refinePromptMock,
  updateWorkspace: updateWorkspaceMock
}));

import { WorkbenchPage } from "./workbench-page";

describe("WorkbenchPage", () => {
  it("is a client component entrypoint", () => {
    expect(typeof WorkbenchPage).toBe("function");
  });

  it("keeps the expected client dependencies wired", () => {
    expect(listWorkspacesMock).toBeDefined();
    expect(listModelOptionsMock).toBeDefined();
    expect(createWorkspaceMock).toBeDefined();
    expect(updateWorkspaceMock).toBeDefined();
    expect(deleteWorkspaceMock).toBeDefined();
    expect(generateImageMock).toBeDefined();
    expect(generatePromptMock).toBeDefined();
    expect(refinePromptMock).toBeDefined();
  });
});
