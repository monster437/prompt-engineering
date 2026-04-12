import { describe, expect, it, vi } from "vitest";

const { listModelOptionsMock } = vi.hoisted(() => ({
  listModelOptionsMock: vi.fn()
}));

vi.mock("@/lib/configs", () => ({
  listModelOptions: listModelOptionsMock
}));

import { GET } from "@/app/api/models/route";

describe("GET /api/models", () => {
  it("returns flattened model options", async () => {
    listModelOptionsMock.mockResolvedValue([
      {
        configId: "cfg_text",
        configType: "text",
        providerName: "OpenRouter",
        modelName: "gpt-4.1-mini",
        label: "gpt-4.1-mini (OpenRouter)"
      },
      {
        configId: "cfg_image",
        configType: "image",
        providerName: "Replicate",
        modelName: "flux-dev",
        label: "flux-dev (Replicate)",
        providerId: "black-forest-labs"
      }
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(listModelOptionsMock).toHaveBeenCalledTimes(1);
    expect(json).toEqual({
      items: [
        {
          configId: "cfg_text",
          configType: "text",
          providerName: "OpenRouter",
          modelName: "gpt-4.1-mini",
          label: "gpt-4.1-mini (OpenRouter)"
        },
        {
          configId: "cfg_image",
          configType: "image",
          providerName: "Replicate",
          modelName: "flux-dev",
          label: "flux-dev (Replicate)",
          providerId: "black-forest-labs"
        }
      ]
    });
  });

  it("preserves config identity when flattening multiple models from one config", async () => {
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
        configId: "cfg_text",
        configType: "text",
        providerName: "OpenRouter",
        modelName: "claude-3.7-sonnet",
        label: "Claude 3.7 Sonnet (OpenRouter)",
        providerId: "anthropic"
      }
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      items: [
        {
          configId: "cfg_text",
          configType: "text",
          providerName: "OpenRouter",
          modelName: "gpt-4.1-mini",
          label: "GPT-4.1 Mini (OpenRouter)",
          providerId: "openai"
        },
        {
          configId: "cfg_text",
          configType: "text",
          providerName: "OpenRouter",
          modelName: "claude-3.7-sonnet",
          label: "Claude 3.7 Sonnet (OpenRouter)",
          providerId: "anthropic"
        }
      ]
    });
  });

  it("returns an empty items list when no models are configured", async () => {
    listModelOptionsMock.mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ items: [] });
  });
});
