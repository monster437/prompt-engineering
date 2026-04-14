import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  CreateProviderConfigRequest,
  ProviderConfigDto,
  UpdateProviderConfigRequest
} from "@/lib/types";
import { createConfig, deleteConfig, listConfigs, updateConfig } from "./config-client";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("config client", () => {
  it("lists configs with a GET request", async () => {
    const response: ProviderConfigDto[] = [
      {
        id: "cfg_1",
        type: "text",
        providerName: "OpenAI",
        baseURL: "https://api.openai.com/v1",
        apiKeyMasked: "sk-****abcd",
        models: [{ modelName: "gpt-4.1", label: "gpt-4.1" }]
      }
    ];
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listConfigs()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/configs", { method: "GET" });
  });

  it("creates a config with json body", async () => {
    const payload: CreateProviderConfigRequest = {
      type: "text",
      providerName: "OpenAI",
      baseURL: "https://api.openai.com/v1",
      apiKey: "sk-secret",
      models: [{ modelName: "gpt-4.1", label: "gpt-4.1" }]
    };
    const response: ProviderConfigDto = {
      id: "cfg_1",
      type: payload.type,
      providerName: payload.providerName,
      baseURL: payload.baseURL,
      apiKeyMasked: "sk-****cret",
      models: payload.models
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createConfig(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("updates a config with patch json body", async () => {
    const payload: UpdateProviderConfigRequest = {
      providerName: "OpenRouter",
      models: [{ modelName: "gpt-4.1-mini", label: "gpt-4.1-mini", providerId: "openai" }]
    };
    const response: ProviderConfigDto = {
      id: "cfg_1",
      type: "text",
      providerName: "OpenRouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKeyMasked: "sk-****abcd",
      models: payload.models ?? []
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateConfig("cfg_1", payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/configs/cfg_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  });

  it("deletes a config by id", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteConfig("cfg_1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/configs/cfg_1", { method: "DELETE" });
  });
});
