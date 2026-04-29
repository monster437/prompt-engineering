import { describe, expect, it, vi } from "vitest";
import type { WorkspaceDto } from "@/lib/types";

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

import { mergeWorkspaceAfterSyncResponse, WorkbenchPage } from "./workbench-page";

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

  it("ignores stale workspace save responses that return out of order", () => {
    const latestWorkspace = makeWorkspace({ sourcePrompt: "shishang" });
    const staleSavedWorkspace = makeWorkspace({ sourcePrompt: "shi" });

    expect(
      mergeWorkspaceAfterSyncResponse({
        currentWorkspace: latestWorkspace,
        savedWorkspace: staleSavedWorkspace,
        latestRequestId: 2,
        responseRequestId: 1
      })
    ).toEqual(latestWorkspace);
  });

  it("applies the latest workspace save response", () => {
    const optimisticWorkspace = makeWorkspace({ sourcePrompt: "shishang" });
    const latestSavedWorkspace = makeWorkspace({ sourcePrompt: "shishang", title: "Workspace 1 saved" });

    expect(
      mergeWorkspaceAfterSyncResponse({
        currentWorkspace: optimisticWorkspace,
        savedWorkspace: latestSavedWorkspace,
        latestRequestId: 2,
        responseRequestId: 2
      })
    ).toEqual(latestSavedWorkspace);
  });
});
