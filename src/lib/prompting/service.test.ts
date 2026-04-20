import { afterEach, describe, expect, it, vi } from "vitest";

const {
  findWorkspaceMock,
  findConfigMock,
  updateWorkspaceMock,
  runPromptOrchestrationMock,
  decryptSecretMock
} = vi.hoisted(() => ({
  findWorkspaceMock: vi.fn(),
  findConfigMock: vi.fn(),
  updateWorkspaceMock: vi.fn(),
  runPromptOrchestrationMock: vi.fn(),
  decryptSecretMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    workspace: {
      findUniqueOrThrow: findWorkspaceMock,
      update: updateWorkspaceMock
    },
    providerConfig: {
      findUniqueOrThrow: findConfigMock
    }
  }
}));

vi.mock("@/lib/security/crypto", () => ({
  decryptSecret: decryptSecretMock
}));

vi.mock("@/lib/prompting/orchestrator", () => ({
  runPromptOrchestration: runPromptOrchestrationMock
}));

import { runGeneratePrompt, runRefinePrompt } from "@/lib/prompting/service";

function createWorkspaceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "ws_1",
    title: "工作台 1",
    mode: "OPTIMIZE",
    outputLanguage: "ZH",
    selectedTextModel: null,
    selectedTextConfig: null,
    selectedTargetType: "general",
    selectedImageConfig: null,
    selectedImageAspectRatio: "auto",
    selectedImageModel: null,
    sourcePrompt: "旧提示词",
    sourcePromptImages: "[]",
    questionMessages: "[]",
    answers: "[]",
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
    generatedImageResult: null,
    status: "IDLE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

afterEach(() => {
  findWorkspaceMock.mockReset();
  findConfigMock.mockReset();
  updateWorkspaceMock.mockReset();
  runPromptOrchestrationMock.mockReset();
  decryptSecretMock.mockReset();
});

describe("runGeneratePrompt", () => {
  it("loads the workspace and config, runs orchestration, and persists a completed optimize result", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "新的提示词",
      summary: {
        style: "cinematic",
        scene: "beach",
        time: "sunset",
        mood: "calm",
        quality: "high detail",
        composition: "wide shot",
        extras: []
      },
      contextSnapshot: { subject: "girl" }
    });
    updateWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    const sourcePromptImages = [
      {
        id: "img_1",
        name: "ref.png",
        mimeType: "image/png",
        dataUrl: "data:image/png;base64,AAAA",
        sizeBytes: 128
      }
    ];

    const result = await runGeneratePrompt({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_text",
      selectedTextModel: "gpt-4.1-mini",
      sourcePrompt: "一个女孩站在海边",
      sourcePromptImages
    });

    expect(runPromptOrchestrationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "optimize",
        workspace: expect.objectContaining({
          selectedImageAspectRatio: "auto",
          sourcePromptImages
        }),
        provider: expect.objectContaining({
          baseURL: "https://example.com",
          apiKey: "sk-test",
          model: "gpt-4.1-mini"
        })
      })
    );
    expect(updateWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ws_1" },
        data: expect.objectContaining({
          sourcePrompt: "一个女孩站在海边",
          sourcePromptImages: JSON.stringify(sourcePromptImages),
          finalPrompt: "新的提示词",
          generatedImageResult: null,
          status: "IDLE"
        })
      })
    );
    expect(result.status).toBe("completed");
  });

  it("persists interview clarification state when orchestration asks a follow-up question", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord({ mode: "INTERVIEW" }));
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "needs_clarification",
      question: "主角穿什么风格的衣服？",
      contextSnapshot: { missing: ["wardrobe"] }
    });
    updateWorkspaceMock.mockResolvedValue(createWorkspaceRecord({ mode: "INTERVIEW", status: "ASKING" }));

    const result = await runGeneratePrompt({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_text",
      selectedTextModel: "gpt-4.1-mini",
      sourcePrompt: "一个女孩站在海边",
      sourcePromptImages: []
    });

    expect(updateWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionMessages: JSON.stringify(["主角穿什么风格的衣服？"]),
          generatedImageResult: null,
          status: "ASKING"
        })
      })
    );
    expect(result).toMatchObject({
      status: "needs_clarification",
      question: "主角穿什么风格的衣服？"
    });
  });

  it("appends a new interview clarification question to existing question messages", async () => {
    findWorkspaceMock.mockResolvedValue(
      createWorkspaceRecord({
        mode: "INTERVIEW",
        questionMessages: JSON.stringify(["你想要什么画风？"])
      })
    );
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "needs_clarification",
      question: "主角穿什么风格的衣服？",
      contextSnapshot: { missing: ["wardrobe"] }
    });

    await runGeneratePrompt({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_text",
      selectedTextModel: "gpt-4.1-mini",
      sourcePrompt: "一个女孩站在海边",
      sourcePromptImages: []
    });

    expect(updateWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionMessages: JSON.stringify(["你想要什么画风？", "主角穿什么风格的衣服？"]),
          generatedImageResult: null,
          status: "ASKING"
        })
      })
    );
  });

  it("throws when interview clarification lacks a usable question", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord({ mode: "INTERVIEW" }));
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "needs_clarification",
      question: "   ",
      contextSnapshot: { missing: ["wardrobe"] }
    });

    await expect(
      runGeneratePrompt({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_text",
        selectedTextModel: "gpt-4.1-mini",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: []
      })
    ).rejects.toThrow(/interview.*question/i);

    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });

  it("throws when the selected config is not text", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });

    await expect(
      runGeneratePrompt({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image",
        selectedTextModel: "gpt-4.1-mini",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: []
      })
    ).rejects.toThrow(/text config/i);

    expect(runPromptOrchestrationMock).not.toHaveBeenCalled();
    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });

  it("throws when optimize orchestration returns clarification instead of a completed result", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "needs_clarification",
      question: "还需要更多信息吗？",
      contextSnapshot: { missing: ["subject"] }
    });

    await expect(
      runGeneratePrompt({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_text",
        selectedTextModel: "gpt-4.1-mini",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: []
      })
    ).rejects.toThrow(/optimize/i);

    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });
});

describe("runRefinePrompt", () => {
  it("persists refine instruction and completed result", async () => {
    findWorkspaceMock.mockResolvedValue(
      createWorkspaceRecord({
        finalPrompt: "旧提示词",
        sourcePromptImages: JSON.stringify([
          {
            id: "img_1",
            name: "ref.png",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA",
            sizeBytes: 128
          }
        ]),
        parameterSummary: JSON.stringify({
          style: "cinematic",
          scene: "beach",
          time: "sunset",
          mood: "calm",
          quality: "high detail",
          composition: "wide shot",
          extras: []
        })
      })
    );
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "雨夜版本提示词",
      summary: {
        style: "cinematic",
        scene: "rainy street",
        time: "night",
        mood: "moody",
        quality: "high detail",
        composition: "wide shot",
        extras: []
      },
      contextSnapshot: { weather: "rain" }
    });
    updateWorkspaceMock.mockResolvedValue(createWorkspaceRecord());

    const result = await runRefinePrompt({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_text",
      selectedTextModel: "gpt-4.1-mini",
      refineInstruction: "改成雨夜"
    });

    expect(runPromptOrchestrationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "refine",
        workspace: expect.objectContaining({
          selectedImageAspectRatio: "auto",
          sourcePromptImages: [expect.objectContaining({ name: "ref.png" })]
        })
      })
    );
    expect(updateWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          refineInstruction: "改成雨夜",
          finalPrompt: "雨夜版本提示词",
          generatedImageResult: null,
          status: "IDLE"
        })
      })
    );
    expect(result.finalPrompt).toBe("雨夜版本提示词");
  });

  it("throws when refine orchestration returns clarification instead of a completed result", async () => {
    findWorkspaceMock.mockResolvedValue(
      createWorkspaceRecord({
        finalPrompt: "旧提示词",
        parameterSummary: JSON.stringify({
          style: "cinematic",
          scene: "beach",
          time: "sunset",
          mood: "calm",
          quality: "high detail",
          composition: "wide shot",
          extras: []
        })
      })
    );
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    runPromptOrchestrationMock.mockResolvedValue({
      status: "needs_clarification",
      question: "想保留什么风格？",
      contextSnapshot: { missing: ["style"] }
    });

    await expect(
      runRefinePrompt({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_text",
        selectedTextModel: "gpt-4.1-mini",
        refineInstruction: "改成雨夜"
      })
    ).rejects.toThrow(/refine/i);

    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });
});
