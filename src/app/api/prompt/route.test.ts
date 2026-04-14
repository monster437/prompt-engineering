import { afterEach, describe, expect, it, vi } from "vitest";

const { runGeneratePromptMock, runRefinePromptMock } = vi.hoisted(() => ({
  runGeneratePromptMock: vi.fn(),
  runRefinePromptMock: vi.fn()
}));

vi.mock("@/lib/prompting/service", () => ({
  runGeneratePrompt: runGeneratePromptMock,
  runRefinePrompt: runRefinePromptMock
}));

import { POST as postGenerate } from "@/app/api/prompt/generate/route";
import { POST as postRefine } from "@/app/api/prompt/refine/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  runGeneratePromptMock.mockReset();
  runRefinePromptMock.mockReset();
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
      body: JSON.stringify({ workspaceId: "", sourcePrompt: "", selectedConfigId: "cfg_1" })
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
        sourcePrompt: "A rainy neon street"
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
    expect(runGeneratePromptMock).toHaveBeenCalledWith({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_1",
      selectedTextModel: "gpt-4.1",
      sourcePrompt: "A rainy neon street"
    });
    expect(await response.json()).toEqual(result);
  });

  it("returns 500 with the service error message when generation fails", async () => {
    const request = new Request("http://localhost/api/prompt/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_1",
        selectedTextModel: "gpt-4.1",
        sourcePrompt: "A rainy neon street"
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
