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
});

describe("POST /api/prompt/refine", () => {
  it("returns 400 for invalid refine payload", async () => {
    const request = new Request("http://localhost/api/prompt/refine", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws_1", refineInstruction: "" })
    });

    const response = await postRefine(request);

    expect(response.status).toBe(400);
    expect(runRefinePromptMock).not.toHaveBeenCalled();
  });
});
