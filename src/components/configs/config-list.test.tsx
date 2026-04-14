import { describe, expect, it, vi } from "vitest";

import type { ProviderConfigDto } from "@/lib/types";

import { ConfigList } from "./config-list";

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

describe("ConfigList", () => {
  it("renders config items and actions", () => {
    const html = ConfigList({
      configs: [makeConfig(), makeConfig({ id: "cfg_2", providerName: "Replicate", type: "image" })],
      activeConfigId: "cfg_2",
      deletingConfigId: null,
      onCreateNew: vi.fn(),
      onSelectConfig: vi.fn(),
      onDeleteConfig: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("配置列表");
    expect(output).toContain("新建配置");
    expect(output).toContain("OpenAI");
    expect(output).toContain("Replicate（当前）");
  });

  it("wires create action", () => {
    const onCreateNew = vi.fn();
    const html = ConfigList({
      configs: [],
      activeConfigId: null,
      deletingConfigId: null,
      onCreateNew,
      onSelectConfig: vi.fn(),
      onDeleteConfig: vi.fn()
    });

    const button = html.props.children[0].props.children[1];
    button.props.onClick();

    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it("shows empty state", () => {
    const html = ConfigList({
      configs: [],
      activeConfigId: null,
      deletingConfigId: null,
      onCreateNew: vi.fn(),
      onSelectConfig: vi.fn(),
      onDeleteConfig: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("还没有任何模型配置。");
  });
});
