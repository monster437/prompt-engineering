import { describe, expect, it, vi } from "vitest";

import { ConfigForm } from "./config-form";
import type { ConfigFormValue } from "./config-form";

function makeValue(overrides: Partial<ConfigFormValue> = {}): ConfigFormValue {
  return {
    type: "text",
    providerName: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKey: "",
    models: [{ modelName: "gpt-4.1", label: "gpt-4.1", providerId: "openai" }],
    ...overrides
  };
}

describe("ConfigForm", () => {
  it("renders config fields", () => {
    const html = ConfigForm({
      value: makeValue(),
      apiKeyMasked: "sk-****abcd",
      isEditing: true,
      isSaving: false,
      onChange: vi.fn(),
      onSubmit: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("配置编辑区");
    expect(output).toContain("Provider 名称");
    expect(output).toContain("Base URL");
    expect(output).toContain("当前密钥：");
    expect(output).toContain("sk-****abcd");
    expect(html.props.children[1].props.children[4].type.name).toBe("ModelListEditor");
  });

  it("shows create mode copy", () => {
    const html = ConfigForm({
      value: makeValue(),
      apiKeyMasked: null,
      isEditing: false,
      isSaving: false,
      onChange: vi.fn(),
      onSubmit: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("创建配置");
  });

  it("wires submit action", () => {
    const onSubmit = vi.fn();
    const html = ConfigForm({
      value: makeValue(),
      apiKeyMasked: null,
      isEditing: false,
      isSaving: false,
      onChange: vi.fn(),
      onSubmit
    });

    const submitButton = html.props.children[1].props.children[5];
    submitButton.props.onClick();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
