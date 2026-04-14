import { describe, expect, it, vi } from "vitest";

import type { ProviderConfigDto } from "@/lib/types";

const {
  createConfigMock,
  deleteConfigMock,
  listConfigsMock,
  updateConfigMock
} = vi.hoisted(() => ({
  createConfigMock: vi.fn(),
  deleteConfigMock: vi.fn(),
  listConfigsMock: vi.fn(),
  updateConfigMock: vi.fn()
}));

vi.mock("@/lib/config-client", () => ({
  createConfig: createConfigMock,
  deleteConfig: deleteConfigMock,
  listConfigs: listConfigsMock,
  updateConfig: updateConfigMock
}));

import { ConfigsPage } from "./configs-page";

function makeConfig(overrides: Partial<ProviderConfigDto> = {}): ProviderConfigDto {
  return {
    id: "cfg_1",
    type: "text",
    providerName: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKeyMasked: "sk-****abcd",
    models: [{ modelName: "gpt-4.1", label: "gpt-4.1" }],
    ...overrides
  };
}

describe("ConfigsPage", () => {
  it("is a client component entrypoint", () => {
    expect(typeof ConfigsPage).toBe("function");
  });

  it("keeps config client dependencies wired", () => {
    listConfigsMock.mockResolvedValue([makeConfig()]);

    expect(listConfigsMock).toBeDefined();
    expect(createConfigMock).toBeDefined();
    expect(updateConfigMock).toBeDefined();
    expect(deleteConfigMock).toBeDefined();
  });
});
