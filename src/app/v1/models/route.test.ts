import { afterEach, describe, expect, it, vi } from "vitest";

const { listModelOptionsMock } = vi.hoisted(() => ({
  listModelOptionsMock: vi.fn()
}));

vi.mock("@/lib/configs", () => ({
  listModelOptions: listModelOptionsMock
}));

import { GET } from "@/app/v1/models/route";

afterEach(() => {
  listModelOptionsMock.mockReset();
});

describe("GET /v1/models", () => {
  it("returns an OpenAI-style unified model list", async () => {
    listModelOptionsMock.mockResolvedValue([
      {
        configId: "cfg_text",
        configType: "text",
        providerName: "OpenRouter",
        modelName: "gpt-4.1-mini",
        label: "GPT-4.1 Mini (OpenRouter)",
        providerId: "openai"
      },
      {
        configId: "cfg_image",
        configType: "image",
        providerName: "HuanAPI",
        modelName: "grok-imagine-image-pro",
        label: "Grok Imagine Image Pro (HuanAPI)",
        providerId: "xai"
      }
    ]);

    const response = await GET(new Request("http://localhost/v1/models"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(listModelOptionsMock).toHaveBeenCalledTimes(1);
    expect(json).toEqual({
      object: "list",
      data: [
        {
          id: "gpt-4.1-mini",
          object: "model",
          created: 0,
          owned_by: "OpenRouter",
          provider_name: "OpenRouter",
          config_id: "cfg_text",
          config_type: "text",
          label: "GPT-4.1 Mini (OpenRouter)",
          ability: "text",
          provider_id: "openai"
        },
        {
          id: "grok-imagine-image-pro",
          object: "model",
          created: 0,
          owned_by: "HuanAPI",
          provider_name: "HuanAPI",
          config_id: "cfg_image",
          config_type: "image",
          label: "Grok Imagine Image Pro (HuanAPI)",
          ability: "image",
          provider_id: "xai"
        }
      ]
    });
  });

  it("supports filtering by ability=image", async () => {
    listModelOptionsMock.mockResolvedValue([
      {
        configId: "cfg_text",
        configType: "text",
        providerName: "OpenRouter",
        modelName: "gpt-4.1-mini",
        label: "GPT-4.1 Mini (OpenRouter)"
      },
      {
        configId: "cfg_image",
        configType: "image",
        providerName: "HuanAPI",
        modelName: "grok-imagine-image-pro",
        label: "Grok Imagine Image Pro (HuanAPI)"
      }
    ]);

    const response = await GET(new Request("http://localhost/v1/models?ability=image"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      object: "list",
      data: [
        {
          id: "grok-imagine-image-pro",
          object: "model",
          created: 0,
          owned_by: "HuanAPI",
          provider_name: "HuanAPI",
          config_id: "cfg_image",
          config_type: "image",
          label: "Grok Imagine Image Pro (HuanAPI)",
          ability: "image"
        }
      ]
    });
  });

  it("returns 400 for unsupported ability filters", async () => {
    const response = await GET(new Request("http://localhost/v1/models?ability=video"));

    expect(response.status).toBe(400);
    expect(listModelOptionsMock).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: "Invalid ability filter" });
  });
});
