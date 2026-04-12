import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CreateWorkspaceRequest,
  GeneratePromptRequest,
  ModelOptionDto,
  ModelsResponseDto,
  PromptResult,
  RefinePromptRequest,
  UpdateWorkspaceRequest,
  WorkspaceDto
} from "@/lib/types";
import {
  createWorkspace,
  deleteWorkspace,
  generatePrompt,
  listModelOptions,
  listWorkspaces,
  refinePrompt,
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
        selectedImageModel: null,
        sourcePrompt: "",
        questionMessages: [],
        answers: [],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null,
        status: "idle"
      }
    ];
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listWorkspaces()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces", { method: "GET" });
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
      selectedImageModel: null,
      sourcePrompt: "",
      questionMessages: [],
      answers: [],
      finalPrompt: null,
      parameterSummary: null,
      refineInstruction: null,
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
      selectedImageModel: null,
      sourcePrompt: "",
      questionMessages: [],
      answers: [],
      finalPrompt: null,
      parameterSummary: null,
      refineInstruction: null,
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

  it("deletes a workspace by id", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteWorkspace("ws_1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces/ws_1", { method: "DELETE" });
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
      sourcePrompt: "A rainy neon street"
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
