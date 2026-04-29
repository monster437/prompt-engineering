import { afterEach, describe, expect, it, vi } from "vitest";

const {
  findWorkspaceMock,
  findConfigMock,
  updateWorkspaceMock,
  decryptSecretMock,
  callOpenAiCompatibleImageProviderMock,
  diagnoseOpenAiCompatibleImageProviderMock
} = vi.hoisted(() => ({
  findWorkspaceMock: vi.fn(),
  findConfigMock: vi.fn(),
  updateWorkspaceMock: vi.fn(),
  decryptSecretMock: vi.fn(),
  callOpenAiCompatibleImageProviderMock: vi.fn(),
  diagnoseOpenAiCompatibleImageProviderMock: vi.fn()
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

vi.mock("@/lib/providers/openai-compatible", () => ({
  callOpenAiCompatibleImageProvider: callOpenAiCompatibleImageProviderMock,
  diagnoseOpenAiCompatibleImageProvider: diagnoseOpenAiCompatibleImageProviderMock
}));

import { runDiagnoseImageProvider, runGenerateImage } from "@/lib/image-generation/service";

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
    selectedImageModel: "gpt-image-1",
    sourcePrompt: "旧提示词",
    sourcePromptImages: "[]",
    questionMessages: "[]",
    answers: "[]",
    finalPrompt: "电影感雨夜街景",
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
  decryptSecretMock.mockReset();
  callOpenAiCompatibleImageProviderMock.mockReset();
  diagnoseOpenAiCompatibleImageProviderMock.mockReset();
});

describe("runGenerateImage", () => {
  it("uses the workspace final prompt directly, then generates and persists the image result", async () => {
    const providerResult = {
      images: [{ url: "https://example.com/generated.png" }],
      revisedPrompt: "电影感雨夜街景，霓虹反射"
    };

    findWorkspaceMock.mockResolvedValue(
      createWorkspaceRecord({
        selectedTextConfig: "cfg_text",
        selectedTextModel: "gpt-4.1-mini",
        selectedTargetType: '{"styleTags":["xianxia","scene-narrative"],"cameraOrientation":"back"}'
      })
    );
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-image-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    callOpenAiCompatibleImageProviderMock.mockResolvedValue(providerResult);

    await expect(
      runGenerateImage({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16@1024x1792",
        prompt: "前端传入但最终以后端 workspace.finalPrompt 为准"
      })
    ).resolves.toEqual({
      ...providerResult,
      usedPrompt: "电影感雨夜街景",
      promptSource: "workspace_final_prompt",
      promptEnhancementError: null,
      selectedImageConfig: "cfg_image",
      selectedImageModel: "gpt-image-1",
      selectedImageAspectRatio: "9:16@1024x1792"
    });

    expect(callOpenAiCompatibleImageProviderMock).toHaveBeenCalledWith({
      endpoint: "/v1/images/generations",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-image-1",
      aspectRatio: "9:16@1024x1792",
      prompt: "电影感雨夜街景"
    });

    expect(updateWorkspaceMock).toHaveBeenCalledWith({
      where: { id: "ws_1" },
      data: {
        selectedImageConfig: "cfg_image",
        selectedImageAspectRatio: "9:16@1024x1792",
        selectedImageModel: "gpt-image-1",
        generatedImageResult: JSON.stringify({
          ...providerResult,
          usedPrompt: "电影感雨夜街景",
          promptSource: "workspace_final_prompt",
          promptEnhancementError: null,
          selectedImageConfig: "cfg_image",
          selectedImageModel: "gpt-image-1",
          selectedImageAspectRatio: "9:16@1024x1792"
        })
      }
    });
  });

  it("returns the final prompt as usedPrompt without any enhancement warning", async () => {
    const providerResult = {
      images: [{ url: "https://example.com/generated.png" }],
      revisedPrompt: null
    };

    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord({
      selectedTextConfig: null,
      selectedTextModel: null,
      finalPrompt: "电影感雨夜街景"
    }));
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-image-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    callOpenAiCompatibleImageProviderMock.mockResolvedValue(providerResult);

    await expect(
      runGenerateImage({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "16:9@1280x720",
        prompt: "ignored"
      })
    ).resolves.toEqual({
      ...providerResult,
      usedPrompt: "电影感雨夜街景",
      promptSource: "workspace_final_prompt",
      promptEnhancementError: null,
      selectedImageConfig: "cfg_image",
      selectedImageModel: "gpt-image-1",
      selectedImageAspectRatio: "16:9@1280x720"
    });

    expect(callOpenAiCompatibleImageProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "电影感雨夜街景"
      })
    );
  });

  it("throws when the selected config is not image", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });

    await expect(
      runGenerateImage({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_text",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16@1024x1792",
        prompt: "test"
      })
    ).rejects.toThrow(/image config/i);

    expect(callOpenAiCompatibleImageProviderMock).not.toHaveBeenCalled();
    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });

  it("throws when the workspace final prompt is empty", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord({ finalPrompt: null }));
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });

    await expect(
      runGenerateImage({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16@1024x1792",
        prompt: "test"
      })
    ).rejects.toThrow(/final prompt/i);

    expect(callOpenAiCompatibleImageProviderMock).not.toHaveBeenCalled();
    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });
});

describe("runDiagnoseImageProvider", () => {
  it("loads workspace/config, calls provider diagnose helper, and returns structured result", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "HuanAPI",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    diagnoseOpenAiCompatibleImageProviderMock.mockResolvedValue({
      connectivity: "ok",
      modelsEndpointStatus: 200,
      modelsEndpointStatusText: "OK",
      modelFound: true,
      availableModelCount: 3,
      similarModels: ["grok-imagine-image-pro"],
      message: "图片通道诊断成功：provider 可达、token 有效，且已找到目标模型。"
    });

    await expect(
      runDiagnoseImageProvider({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image",
        selectedImageModel: "grok-imagine-image-pro"
      })
    ).resolves.toEqual({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image",
      providerName: "HuanAPI",
      baseURL: "https://example.com",
      selectedImageModel: "grok-imagine-image-pro",
      connectivity: "ok",
      modelsEndpointStatus: 200,
      modelsEndpointStatusText: "OK",
      modelFound: true,
      availableModelCount: 3,
      similarModels: ["grok-imagine-image-pro"],
      message: "图片通道诊断成功：provider 可达、token 有效，且已找到目标模型。"
    });

    expect(diagnoseOpenAiCompatibleImageProviderMock).toHaveBeenCalledWith({
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "grok-imagine-image-pro"
    });
    expect(updateWorkspaceMock).not.toHaveBeenCalled();
  });

  it("throws when the selected config is not image", async () => {
    findWorkspaceMock.mockResolvedValue(createWorkspaceRecord());
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });

    await expect(
      runDiagnoseImageProvider({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_text",
        selectedImageModel: "gpt-image-1"
      })
    ).rejects.toThrow(/image config/i);

    expect(diagnoseOpenAiCompatibleImageProviderMock).not.toHaveBeenCalled();
  });
});
