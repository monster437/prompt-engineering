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

import { listImageCatalog, listModelOptions } from "@/lib/configs";

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

  it("deduplicates duplicate models within the same config", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "cfg_text",
        type: "TEXT",
        providerName: "OpenRouter",
        modelsJson: JSON.stringify([
          {
            modelName: "gpt-5.2",
            label: "GPT-5.2",
            providerId: "openai"
          },
          {
            modelName: "gpt-5.2",
            label: "GPT-5.2 duplicate",
            providerId: "openai"
          }
        ])
      }
    ]);

    const result = await listModelOptions();

    expect(result).toEqual([
      {
        configId: "cfg_text",
        configType: "text",
        providerName: "OpenRouter",
        modelName: "gpt-5.2",
        label: "GPT-5.2 (OpenRouter)",
        providerId: "openai"
      }
    ]);
  });
});

describe("listImageCatalog", () => {
  it("returns provider/model metadata and shared aspect ratio defaults for image configs", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "cfg_image",
        providerName: "HuanAPI",
        baseUrl: "https://example.com/v1",
        modelsJson: JSON.stringify([
          {
            modelName: "grok-imagine-image-pro",
            label: "Grok Imagine Image Pro",
            providerId: "xai"
          },
          {
            modelName: "grok-imagine-image-pro",
            label: "Duplicate should be ignored",
            providerId: "xai"
          },
          {
            modelName: "flux-dev",
            label: "FLUX Dev"
          }
        ])
      }
    ]);

    const result = await listImageCatalog();

    expect(findManyMock).toHaveBeenCalledWith({
      where: { type: "IMAGE" },
      select: {
        id: true,
        providerName: true,
        baseUrl: true,
        modelsJson: true
      },
      orderBy: { createdAt: "asc" }
    });
    expect(result).toEqual({
      defaults: {
        aspectRatio: "auto",
        resolution: "auto"
      },
      aspectRatios: [
        {
          value: "auto",
          label: "auto（自动）",
          resolution: "auto",
          width: null,
          height: null
        },
        {
          value: "16:9@1792x1024",
          label: "16:9（1792x1024）",
          resolution: "1792x1024",
          width: 1792,
          height: 1024
        },
        {
          value: "16:9@1280x720",
          label: "16:9（1280x720）",
          resolution: "1280x720",
          width: 1280,
          height: 720
        },
        {
          value: "9:16@1024x1792",
          label: "9:16（1024x1792）",
          resolution: "1024x1792",
          width: 1024,
          height: 1792
        },
        {
          value: "9:16@720x1280",
          label: "9:16（720x1280）",
          resolution: "720x1280",
          width: 720,
          height: 1280
        },
        {
          value: "2:3",
          label: "2:3",
          resolution: null,
          width: null,
          height: null
        },
        {
          value: "3:2",
          label: "3:2",
          resolution: null,
          width: null,
          height: null
        },
        {
          value: "4:3",
          label: "4:3",
          resolution: null,
          width: null,
          height: null
        },
        {
          value: "3:4",
          label: "3:4",
          resolution: null,
          width: null,
          height: null
        },
        {
          value: "1:1@1024x1024",
          label: "1:1（1024x1024）",
          resolution: "1024x1024",
          width: 1024,
          height: 1024
        }
      ],
      providers: [
        {
          configId: "cfg_image",
          providerName: "HuanAPI",
          baseURL: "https://example.com/v1",
          modelCount: 2
        }
      ],
      items: [
        {
          configId: "cfg_image",
          providerName: "HuanAPI",
          baseURL: "https://example.com/v1",
          modelName: "grok-imagine-image-pro",
          label: "Grok Imagine Image Pro",
          providerId: "xai",
          ability: "image",
          supportedAspectRatios: [
            "auto",
            "16:9@1792x1024",
            "16:9@1280x720",
            "9:16@1024x1792",
            "9:16@720x1280",
            "2:3",
            "3:2",
            "4:3",
            "3:4",
            "1:1@1024x1024"
          ],
          defaultAspectRatio: "auto",
          defaultResolution: "auto"
        },
        {
          configId: "cfg_image",
          providerName: "HuanAPI",
          baseURL: "https://example.com/v1",
          modelName: "flux-dev",
          label: "FLUX Dev",
          ability: "image",
          supportedAspectRatios: [
            "auto",
            "16:9@1792x1024",
            "16:9@1280x720",
            "9:16@1024x1792",
            "9:16@720x1280",
            "2:3",
            "3:2",
            "4:3",
            "3:4",
            "1:1@1024x1024"
          ],
          defaultAspectRatio: "auto",
          defaultResolution: "auto"
        }
      ]
    });
    expect(decryptSecretMock).not.toHaveBeenCalled();
    expect(maskApiKeyMock).not.toHaveBeenCalled();
  });
});
