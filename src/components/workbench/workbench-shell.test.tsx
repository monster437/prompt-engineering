import { describe, expect, it, vi } from "vitest";

const {
  createEmptyWorkspaceMock,
  listWorkspacesMock,
  updateWorkspaceMock
} = vi.hoisted(() => ({
  createEmptyWorkspaceMock: vi.fn((title: string) => ({
    title,
    mode: "optimize",
    outputLanguage: "zh",
    selectedTargetType: "general",
    status: "idle"
  })),
  listWorkspacesMock: vi.fn().mockResolvedValue([
    {
      id: "ws_1",
      title: "工作台 1",
      mode: "optimize",
      outputLanguage: "zh",
      selectedTargetType: "general",
      sourcePrompt: "",
      questionMessages: [],
      answers: [],
      status: "idle"
    }
  ]),
  updateWorkspaceMock: vi.fn((payload: Record<string, unknown>) => ({
    id: "ws_1",
    title: "工作台 1",
    mode: payload.mode,
    outputLanguage: payload.outputLanguage,
    selectedTargetType: "general",
    sourcePrompt: "",
    questionMessages: payload.questionMessages,
    answers: payload.answers,
    status: payload.status
  }))
}));

vi.mock("@/lib/workspaces", () => ({
  createEmptyWorkspace: createEmptyWorkspaceMock,
  listWorkspaces: listWorkspacesMock,
  toWorkspaceDto: (workspace: Record<string, unknown>) => workspace,
  toWorkspaceUpdateData: (payload: Record<string, unknown>) => payload
}));

vi.mock("@/lib/db", () => ({
  db: {
    workspace: {
      update: vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(updateWorkspaceMock(data))
      )
    }
  }
}));

import { GET } from "@/app/api/workspaces/route";
import { PATCH } from "@/app/api/workspaces/[id]/route";
import { createEmptyWorkspace } from "@/lib/workspaces";

describe("createEmptyWorkspace", () => {
  it("creates the default optimize workspace state", () => {
    expect(createEmptyWorkspace("工作台 1")).toMatchObject({
      title: "工作台 1",
      mode: "optimize",
      outputLanguage: "zh",
      selectedTargetType: "general",
      status: "idle"
    });
  });
});

describe("workspace api mapping", () => {
  it("returns workspace dto shape from GET", async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json[0]).toMatchObject({
      mode: "optimize",
      outputLanguage: "zh",
      questionMessages: [],
      answers: []
    });
  });

  it("returns patched workspace dto shape", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/workspaces/ws_1", {
        method: "PATCH",
        body: JSON.stringify({
          mode: "interview",
          outputLanguage: "en",
          questionMessages: ["风格是什么？"],
          answers: ["电影感"],
          status: "asking"
        })
      }),
      {
        params: Promise.resolve({ id: "ws_1" })
      }
    );

    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      mode: "interview",
      outputLanguage: "en",
      questionMessages: ["风格是什么？"],
      answers: ["电影感"],
      status: "asking"
    });
  });
});
