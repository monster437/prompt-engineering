import { afterEach, describe, expect, it, vi } from "vitest";

const { runGenerateImageMock } = vi.hoisted(() => ({
  runGenerateImageMock: vi.fn()
}));

vi.mock("@/lib/image-generation/service", () => ({
  runGenerateImage: runGenerateImageMock
}));

import { POST } from "@/app/api/image/generate/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  runGenerateImageMock.mockReset();
});

describe("POST /api/image/generate", () => {
  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/image/generate", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid image payload" });
  });

  it("returns 400 for invalid image payload", async () => {
    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws_1", selectedConfigId: "" })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(runGenerateImageMock).not.toHaveBeenCalled();
  });

  it("returns the generated image result for a valid payload", async () => {
    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image_1",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16",
        prompt: "A rainy neon street"
      })
    });
    const result = {
      images: [{ url: "https://example.com/generated.png" }],
      revisedPrompt: "A rainy neon street at night"
    };
    runGenerateImageMock.mockResolvedValue(result);

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(runGenerateImageMock).toHaveBeenCalledWith(
      {
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image_1",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16",
        prompt: "A rainy neon street"
      },
      { signal: request.signal }
    );
    expect(await response.json()).toEqual(result);
  });

  it("returns 500 with the service error message when generation fails", async () => {
    const request = new Request("http://localhost/api/image/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image_1",
        selectedImageModel: "gpt-image-1",
        selectedImageAspectRatio: "9:16",
        prompt: "A rainy neon street"
      })
    });
    runGenerateImageMock.mockRejectedValue(new Error("Image generation requires a workspace final prompt"));

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Image generation requires a workspace final prompt" });
  });
});
