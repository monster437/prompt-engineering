import { afterEach, describe, expect, it, vi } from "vitest";

const { runDiagnoseImageProviderMock } = vi.hoisted(() => ({
  runDiagnoseImageProviderMock: vi.fn()
}));

vi.mock("@/lib/image-generation/service", () => ({
  runDiagnoseImageProvider: runDiagnoseImageProviderMock
}));

import { POST } from "@/app/api/image/diagnose/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  runDiagnoseImageProviderMock.mockReset();
});

describe("POST /api/image/diagnose", () => {
  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/image/diagnose", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid image diagnose payload" });
  });

  it("returns 400 for invalid diagnose payload", async () => {
    const request = new Request("http://localhost/api/image/diagnose", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws_1", selectedConfigId: "" })
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(runDiagnoseImageProviderMock).not.toHaveBeenCalled();
  });

  it("returns the diagnose result for a valid payload", async () => {
    const request = new Request("http://localhost/api/image/diagnose", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image_1",
        selectedImageModel: "grok-imagine-image-pro"
      })
    });
    const result = {
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
      providerName: "HuanAPI",
      baseURL: "https://example.com",
      selectedImageModel: "grok-imagine-image-pro",
      connectivity: "ok" as const,
      modelsEndpointStatus: 200,
      modelsEndpointStatusText: "OK",
      modelFound: true,
      availableModelCount: 3,
      similarModels: ["grok-imagine-image-pro"],
      message: "图片通道诊断成功：provider 可达、token 有效，且已找到目标模型。"
    };
    runDiagnoseImageProviderMock.mockResolvedValue(result);

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(runDiagnoseImageProviderMock).toHaveBeenCalledWith({
      workspaceId: "ws_1",
      selectedConfigId: "cfg_image_1",
      selectedImageModel: "grok-imagine-image-pro"
    });
    expect(await response.json()).toEqual(result);
  });

  it("returns 500 with the service error message when diagnose fails", async () => {
    const request = new Request("http://localhost/api/image/diagnose", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_1",
        selectedConfigId: "cfg_image_1",
        selectedImageModel: "grok-imagine-image-pro"
      })
    });
    runDiagnoseImageProviderMock.mockRejectedValue(new Error("Image requests require an image config"));

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Image requests require an image config" });
  });
});
