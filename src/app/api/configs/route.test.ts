import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/configs", () => ({
  listConfigs: vi.fn().mockResolvedValue([]),
  createConfig: vi.fn().mockResolvedValue({ id: "cfg_1" })
}));

import { GET, POST } from "@/app/api/configs/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
});

describe("/api/configs", () => {
  it("returns config list", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("creates a config", async () => {
    const request = new Request("http://localhost/api/configs", {
      method: "POST",
      body: JSON.stringify({
        type: "text",
        providerName: "OpenRouter",
        baseURL: "https://openrouter.ai/api",
        apiKey: "sk-1234567890abcd",
        models: [{ modelName: "gpt-4.1-mini", label: "gpt-4.1-mini" }]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/configs", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
