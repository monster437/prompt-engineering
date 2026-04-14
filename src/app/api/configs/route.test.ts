import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const { listConfigsMock, createConfigMock, updateConfigMock, deleteConfigMock } = vi.hoisted(() => ({
  listConfigsMock: vi.fn().mockResolvedValue([]),
  createConfigMock: vi.fn().mockResolvedValue({ id: "cfg_1" }),
  updateConfigMock: vi.fn().mockResolvedValue({ id: "cfg_1", providerName: "OpenAI" }),
  deleteConfigMock: vi.fn()
}));

vi.mock("@/lib/configs", () => ({
  listConfigs: listConfigsMock,
  createConfig: createConfigMock,
  updateConfig: updateConfigMock
}));

vi.mock("@/lib/db", () => ({
  db: {
    providerConfig: {
      delete: deleteConfigMock
    }
  }
}));

import { GET, POST } from "@/app/api/configs/route";
import { DELETE, PATCH } from "@/app/api/configs/[id]/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  listConfigsMock.mockClear();
  createConfigMock.mockClear();
  updateConfigMock.mockClear();
  deleteConfigMock.mockReset();
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
    expect(createConfigMock).toHaveBeenCalledWith({
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://openrouter.ai/api",
      apiKey: "sk-1234567890abcd",
      models: [{ modelName: "gpt-4.1-mini", label: "gpt-4.1-mini" }]
    });
  });

  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/configs", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/configs/[id]", () => {
  it("updates a config", async () => {
    const response = await PATCH(new Request("http://localhost/api/configs/cfg_1", {
      method: "PATCH",
      body: JSON.stringify({
        providerName: "OpenAI",
        apiKey: "sk-new-secret",
        models: [{ modelName: "gpt-4.1", label: "gpt-4.1", providerId: "openai" }]
      })
    }), {
      params: Promise.resolve({ id: "cfg_1" })
    });

    expect(response.status).toBe(200);
    expect(updateConfigMock).toHaveBeenCalledWith("cfg_1", {
      providerName: "OpenAI",
      apiKey: "sk-new-secret",
      models: [{ modelName: "gpt-4.1", label: "gpt-4.1", providerId: "openai" }]
    });
  });

  it("returns 400 for invalid patch payload", async () => {
    const response = await PATCH(new Request("http://localhost/api/configs/cfg_1", {
      method: "PATCH",
      body: JSON.stringify({ providerName: "" })
    }), {
      params: Promise.resolve({ id: "cfg_1" })
    });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/configs/[id]", () => {
  it("returns 404 when the config does not exist", async () => {
    deleteConfigMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "test"
      })
    );

    const response = await DELETE(new Request("http://localhost/api/configs/cfg_missing", { method: "DELETE" }), {
      params: Promise.resolve({ id: "cfg_missing" })
    });

    expect(response.status).toBe(404);
  });
});
