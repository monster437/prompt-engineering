import { OutputLanguage, WorkspaceMode, WorkspaceStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

const { findManyMock, updateMock } = vi.hoisted(() => ({
  findManyMock: vi.fn().mockResolvedValue([
    {
      id: "ws_1",
      title: "工作台 1",
      mode: "OPTIMIZE",
      outputLanguage: "ZH",
      selectedTextModel: null,
      selectedTextConfig: null,
      selectedTargetType: "general",
      selectedImageModel: null,
      sourcePrompt: "",
      questionMessages: "[]",
      answers: "[]",
      finalPrompt: null,
      parameterSummary: null,
      refineInstruction: null,
      status: "IDLE",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]),
  updateMock: vi.fn().mockResolvedValue({
    id: "ws_1",
    title: "工作台 1",
    mode: "INTERVIEW",
    outputLanguage: "EN",
    selectedTextModel: null,
    selectedTextConfig: null,
    selectedTargetType: "general",
    selectedImageModel: null,
    sourcePrompt: "",
    questionMessages: JSON.stringify(["风格是什么？"]),
    answers: JSON.stringify(["电影感"]),
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
    status: "ASKING",
    createdAt: new Date(),
    updatedAt: new Date()
  })
}));

vi.mock("@/lib/db", () => ({
  db: {
    workspace: {
      findMany: findManyMock,
      update: updateMock
    }
  }
}));

import { GET } from "@/app/api/workspaces/route";
import { PATCH } from "@/app/api/workspaces/[id]/route";
import { createEmptyWorkspace, toWorkspaceUpdateData } from "@/lib/workspaces";

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

describe("workspace mapping", () => {
  it("maps app payload to prisma update data", () => {
    expect(
      toWorkspaceUpdateData({
        mode: "interview",
        outputLanguage: "en",
        questionMessages: ["风格是什么？"],
        answers: ["电影感"],
        status: "asking"
      })
    ).toEqual({
      mode: WorkspaceMode.INTERVIEW,
      outputLanguage: OutputLanguage.EN,
      questionMessages: JSON.stringify(["风格是什么？"]),
      answers: JSON.stringify(["电影感"]),
      status: WorkspaceStatus.ASKING
    });
  });

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
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "ws_1" },
      data: {
        mode: WorkspaceMode.INTERVIEW,
        outputLanguage: OutputLanguage.EN,
        questionMessages: JSON.stringify(["风格是什么？"]),
        answers: JSON.stringify(["电影感"]),
        status: WorkspaceStatus.ASKING
      }
    });
  });
});
