import { afterEach, describe, expect, it, vi } from "vitest";

const { runGeneratePromptMock, runRefinePromptMock, runReversePromptInferenceMock } = vi.hoisted(() => ({
  runGeneratePromptMock: vi.fn(),
  runRefinePromptMock: vi.fn(),
  runReversePromptInferenceMock: vi.fn()
}));

vi.mock("@/lib/prompting/service", () => ({
  runGeneratePrompt: runGeneratePromptMock,
  runRefinePrompt: runRefinePromptMock
}));

vi.mock("@/lib/prompting/reverse-service", () => ({
  runReversePromptInference: runReversePromptInferenceMock
}));

import { POST as postGenerate } from "@/app/api/prompt/generate/route";
import { POST as postReverse } from "@/app/api/prompt/reverse/route";
import { POST as postRefine } from "@/app/api/prompt/refine/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  runGeneratePromptMock.mockReset();
  runRefinePromptMock.mockReset();
  runReversePromptInferenceMock.mockReset();
});

describe("POST /api/prompt/generate", () => {
  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/prompt/generate", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await postGenerate(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid prompt payload" });
  });

  it("returns 400 for invalid generate payload", async () => {
    const request = new Request("http://localhost/api/prompt/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "",
        sourcePrompt: "",
        sourcePromptImages: [],
        selectedConfigId: "cfg_1"
      })
    });

    const response = await postGenerate(request);

    expect(response.status).toBe(400);
    expect(runGeneratePromptMock).not.toHaveBeenCalled();
  });

  it("returns the generated prompt result for a valid payload", async () => {
    const request = new Request("http://localhost/api/prompt/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        sourcePrompt: "A rainy neon street",
        sourcePromptImages: []
      })
    });
    const result = {
      status: "completed",
      finalPrompt: "Enhanced rainy neon street prompt",
      contextSnapshot: { sourcePrompt: "A rainy neon street" }
    };
    runGeneratePromptMock.mockResolvedValue(result);

    const response = await postGenerate(request);

    expect(response.status).toBe(200);
    expect(runGeneratePromptMock).toHaveBeenCalledWith(
      {
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        sourcePrompt: "A rainy neon street",
        sourcePromptImages: []
      },
      { signal: request.signal }
    );
    expect(await response.json()).toEqual(result);
  });

  it("accepts image-only prompt generation payloads", async () => {
    const request = new Request("http://localhost/api/prompt/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        sourcePrompt: "",
        sourcePromptImages: [
          {
            id: "img_1",
            name: "reference.png",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA",
            sizeBytes: 128
          }
        ]
      })
    });
    runGeneratePromptMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "Enhanced prompt from image",
      contextSnapshot: { imageCount: 1 }
    });

    const response = await postGenerate(request);

    expect(response.status).toBe(200);
    expect(runGeneratePromptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourcePrompt: "",
        sourcePromptImages: [expect.objectContaining({ name: "reference.png" })]
      }),
      { signal: request.signal }
    );
  });

  it("returns 500 with the service error message when generation fails", async () => {
    const request = new Request("http://localhost/api/prompt/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        sourcePrompt: "A rainy neon street",
        sourcePromptImages: []
      })
    });
    runGeneratePromptMock.mockRejectedValue(new Error("Provider request failed with 401"));

    const response = await postGenerate(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Provider request failed with 401" });
  });
});

describe("POST /api/prompt/refine", () => {
  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/prompt/refine", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await postRefine(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid prompt payload" });
  });

  it("returns 400 for invalid refine payload", async () => {
    const request = new Request("http://localhost/api/prompt/refine", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws_1", refineInstruction: "" })
    });

    const response = await postRefine(request);

    expect(response.status).toBe(400);
    expect(runRefinePromptMock).not.toHaveBeenCalled();
  });

  it("returns the refined prompt result for a valid payload", async () => {
    const request = new Request("http://localhost/api/prompt/refine", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        refineInstruction: "Make it moodier"
      })
    });
    const result = {
      status: "completed",
      finalPrompt: "Moodier rainy neon street prompt",
      contextSnapshot: { refineInstruction: "Make it moodier" }
    };
    runRefinePromptMock.mockResolvedValue(result);

    const response = await postRefine(request);

    expect(response.status).toBe(200);
    expect(runRefinePromptMock).toHaveBeenCalledWith({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      refineInstruction: "Make it moodier"
    });
    expect(await response.json()).toEqual(result);
  });

  it("returns 500 with the service error message when refine fails", async () => {
    const request = new Request("http://localhost/api/prompt/refine", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        refineInstruction: "Make it moodier"
      })
    });
    runRefinePromptMock.mockRejectedValue(new Error("Refine orchestration must return a completed result"));

    const response = await postRefine(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Refine orchestration must return a completed result" });
  });
});

describe("POST /api/prompt/reverse", () => {
  it("returns 400 for invalid reverse payload", async () => {
    const request = new Request("http://localhost/api/prompt/reverse", {
      method: "POST",
      body: JSON.stringify({
        selectedConfigId: "",
        selectedTextModel: "gpt-4.1",
        outputLanguage: "zh",
        sourcePromptImages: [],
        userInstruction: ""
      })
    });

    const response = await postReverse(request);

    expect(response.status).toBe(400);
    expect(runReversePromptInferenceMock).not.toHaveBeenCalled();
  });

  it("returns the reverse prompt result for a valid payload", async () => {
    const request = new Request("http://localhost/api/prompt/reverse", {
      method: "POST",
      body: JSON.stringify({
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
      })
    });
    const result = {
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
    runReversePromptInferenceMock.mockResolvedValue(result);

    const response = await postReverse(request);

    expect(response.status).toBe(200);
    expect(runReversePromptInferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        outputLanguage: "zh",
        sourcePromptImages: [expect.objectContaining({ name: "reference.png" })],
        userInstruction: "偏电影感"
      }),
      { signal: request.signal }
    );
    expect(await response.json()).toEqual(result);
  });
});
