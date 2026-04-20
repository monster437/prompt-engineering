import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CreateReverseWorkspaceRequest,
  CreateWorkspaceRequest,
  DiagnoseImageProviderRequest,
  DiagnoseImageProviderResult,
  GenerateImageRequest,
  GenerateImageResult,
  GeneratePromptRequest,
  ModelOptionDto,
  ModelsResponseDto,
  PromptResult,
  ReversePromptRequest,
  ReverseWorkspaceDto,
  RefinePromptRequest,
  UpdateReverseWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceDto
} from "@/lib/types";
import {
  createReverseWorkspace,
  createWorkspace,
  deleteReverseWorkspace,
  deleteWorkspace,
  diagnoseImageProvider,
  generateImage,
  generatePrompt,
  listModelOptions,
  listReverseWorkspaces,
  listWorkspaces,
  reversePrompt,
  refinePrompt,
  updateReverseWorkspace,
  updateWorkspace
} from "./workbench-client";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("workbench client", () => {
  it("lists workspaces with a GET request", async () => {
    const response: WorkspaceDto[] = [
      {
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
        status: "idle"
      }
    ];
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listWorkspaces()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces", { method: "GET" });
  });

  it("lists reverse workspaces with a GET request", async () => {
    const response: ReverseWorkspaceDto[] = [
      {
        id: "rws_1",
        title: "Reverse workspace 1",
        selectedTextConfig: "cfg_text_1",
        selectedTextModel: "gpt-4.1",
        outputLanguage: "zh",
        userInstruction: "偏电影感",
        sourcePromptImages: [],
        result: null,
        errorMessage: null,
        status: "idle"
      }
    ];
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listReverseWorkspaces()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/reverse-workspaces", { method: "GET" });
  });

  it("creates a workspace with json headers and body", async () => {
    const payload: CreateWorkspaceRequest = { title: "New workspace" };
    const response: WorkspaceDto = {
      id: "ws_2",
      title: "New workspace",
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
      status: "idle"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createWorkspace(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("creates a reverse workspace with json headers and body", async () => {
    const payload: CreateReverseWorkspaceRequest = { title: "Reverse workspace" };
    const response: ReverseWorkspaceDto = {
      id: "rws_2",
      title: "Reverse workspace",
      selectedTextConfig: null,
      selectedTextModel: null,
      outputLanguage: "zh",
      userInstruction: "",
      sourcePromptImages: [],
      result: null,
      errorMessage: null,
      status: "idle"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createReverseWorkspace(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/reverse-workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("updates a workspace by id with patch json body", async () => {
    const payload: UpdateWorkspaceRequest = { title: "Renamed workspace" };
    const response: WorkspaceDto = {
      id: "ws_1",
      title: "Renamed workspace",
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
      status: "idle"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateWorkspace("ws_1", payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces/ws_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("updates a reverse workspace by id with patch json body", async () => {
    const payload: UpdateReverseWorkspaceRequest = {
      userInstruction: "突出镜头语言",
      status: "completed"
    };
    const response: ReverseWorkspaceDto = {
      id: "rws_1",
      title: "Reverse workspace 1",
      selectedTextConfig: "cfg_text_1",
      selectedTextModel: "gpt-4.1",
      outputLanguage: "zh",
      userInstruction: "突出镜头语言",
      sourcePromptImages: [],
      result: {
        status: "completed",
        finalPrompt: "cinematic portrait prompt",
        contextSnapshot: {}
      },
      errorMessage: null,
      status: "completed"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateReverseWorkspace("rws_1", payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/reverse-workspaces/rws_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("deletes a workspace by id", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteWorkspace("ws_1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces/ws_1", { method: "DELETE" });
  });

  it("deletes a reverse workspace by id", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteReverseWorkspace("rws_1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/reverse-workspaces/rws_1", { method: "DELETE" });
  });

  it("unwraps model items from the models response", async () => {
    const items: ModelOptionDto[] = [
      {
        configId: "cfg_1",
        configType: "text",
        providerName: "OpenAI",
        modelName: "gpt-4.1",
        label: "OpenAI / gpt-4.1",
        providerId: "openai"
      }
    ];
    const response: ModelsResponseDto = { items };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listModelOptions()).resolves.toEqual(items);
    expect(fetchMock).toHaveBeenCalledWith("/api/models", { method: "GET" });
  });

  it("posts generate prompt payload and returns the result", async () => {
    const payload: GeneratePromptRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      sourcePrompt: "A rainy neon street",
      sourcePromptImages: []
    };
    const response: PromptResult = {
      status: "completed",
      finalPrompt: "Enhanced rainy neon street prompt",
      contextSnapshot: { sourcePrompt: payload.sourcePrompt }
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generatePrompt(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("passes abort signals through prompt generation requests", async () => {
    const payload: GeneratePromptRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      sourcePrompt: "A rainy neon street",
      sourcePromptImages: []
    };
    const controller = new AbortController();
    const response: PromptResult = {
      status: "completed",
      finalPrompt: "Enhanced rainy neon street prompt",
      contextSnapshot: { sourcePrompt: payload.sourcePrompt }
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generatePrompt(payload, { signal: controller.signal })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  });

  it("posts refine prompt payload and returns the result", async () => {
    const payload: RefinePromptRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      refineInstruction: "Make it moodier"
    };
    const response: PromptResult = {
      status: "completed",
      finalPrompt: "Moodier rainy neon street prompt",
      contextSnapshot: { refineInstruction: payload.refineInstruction }
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refinePrompt(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("posts reverse prompt payload and returns the result", async () => {
    const payload: ReversePromptRequest = {
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      outputLanguage: "zh",
      sourcePromptImages: [
        {
          id: "img_1",
          name: "reference.png",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AAAA",
          sizeBytes: 128
        }
      ],
      userInstruction: "偏电影感"
    };
    const response: PromptResult = {
      status: "completed",
      finalPrompt: "cinematic portrait prompt",
      summary: {
        style: "cinematic",
        scene: "portrait in studio",
        time: "soft daylight",
        mood: "calm",
        quality: "high detail",
        composition: "close-up portrait",
        extras: ["cream backdrop"]
      },
      contextSnapshot: { imageCount: 1 }
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(reversePrompt(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("posts image generation payload and returns the result", async () => {
    const payload: GenerateImageRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
      selectedImageModel: "gpt-image-1",
      selectedImageAspectRatio: "9:16",
      prompt: "A rainy neon street"
    };
    const response: GenerateImageResult = {
      images: [{ url: "https://example.com/generated.png" }],
      revisedPrompt: "A rainy neon street at night"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateImage(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("passes abort signals through image generation requests", async () => {
    const payload: GenerateImageRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
      selectedImageModel: "gpt-image-1",
      selectedImageAspectRatio: "9:16",
      prompt: "A rainy neon street"
    };
    const controller = new AbortController();
    const response: GenerateImageResult = {
      images: [{ url: "https://example.com/generated.png" }],
      revisedPrompt: "A rainy neon street at night"
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateImage(payload, { signal: controller.signal })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  });

  it("posts image diagnose payload and returns the result", async () => {
    const payload: DiagnoseImageProviderRequest = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
      selectedImageModel: "grok-imagine-image-pro"
    };
    const response: DiagnoseImageProviderResult = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
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
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(diagnoseImageProvider(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/image/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("uses api error messages when available", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "Workspace missing" }), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateWorkspace("missing", { title: "Nope" })).rejects.toThrow("Workspace missing");
  });

  it("falls back to a generic message when error json is unavailable", async () => {
    fetchMock.mockResolvedValue(new Response("server blew up", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listWorkspaces()).rejects.toThrow("Request failed");
  });
});
