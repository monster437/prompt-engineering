import { afterEach, describe, expect, it, vi } from "vitest";

const { findManyMock, decryptSecretMock, maskApiKeyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  decryptSecretMock: vi.fn(),
  maskApiKeyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    providerConfig: {
      findMany: findManyMock
    }
  }
}));

vi.mock("@/lib/security/crypto", () => ({
  decryptSecret: decryptSecretMock,
  encryptSecret: vi.fn()
}));

vi.mock("@/lib/security/mask", () => ({
  maskApiKey: maskApiKeyMock
}));

import { listModelOptions } from "@/lib/configs";

afterEach(() => {
  findManyMock.mockReset();
  decryptSecretMock.mockReset();
  maskApiKeyMock.mockReset();
});

describe("listModelOptions", () => {
  it("queries only model option fields and skips secret handling", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "cfg_text",
        type: "TEXT",
        providerName: "OpenRouter",
        modelsJson: JSON.stringify([
          {
            modelName: "gpt-4.1-mini",
            label: "GPT-4.1 Mini",
            providerId: "openai"
          },
          {
            modelName: "claude-3.7-sonnet",
            label: "Claude 3.7 Sonnet",
            providerId: "anthropic"
          }
        ])
      },
      {
        id: "cfg_image",
        type: "IMAGE",
        providerName: "Replicate",
        modelsJson: JSON.stringify([
          {
            modelName: "flux-dev",
            label: "FLUX Dev"
          }
        ])
      }
    ]);

    const result = await listModelOptions();

    expect(findManyMock).toHaveBeenCalledWith({
      select: {
        id: true,
        type: true,
        providerName: true,
        modelsJson: true
      },
      orderBy: { createdAt: "asc" }
    });
    expect(decryptSecretMock).not.toHaveBeenCalled();
    expect(maskApiKeyMock).not.toHaveBeenCalled();
    expect(result).toEqual([
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
      },
      {
        configId: "cfg_image",
        configType: "image",
        providerName: "Replicate",
        modelName: "flux-dev",
        label: "FLUX Dev (Replicate)"
      }
    ]);
  });
});
