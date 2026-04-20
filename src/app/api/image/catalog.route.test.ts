import { describe, expect, it, vi } from "vitest";

const { listImageCatalogMock } = vi.hoisted(() => ({
  listImageCatalogMock: vi.fn()
}));

vi.mock("@/lib/configs", () => ({
  listImageCatalog: listImageCatalogMock
}));

import { GET } from "@/app/api/image/catalog/route";

describe("GET /api/image/catalog", () => {
  it("returns image catalog metadata for frontend rendering", async () => {
    listImageCatalogMock.mockResolvedValue({
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
          value: "1:1",
          label: "1:1",
          resolution: "1024x1024",
          width: 1024,
          height: 1024
        }
      ],
      providers: [
        {
          configId: "cfg_image",
          providerName: "OpenAI Compatible",
          baseURL: "https://example.com/v1",
          modelCount: 2
        }
      ],
      items: [
        {
          configId: "cfg_image",
          providerName: "OpenAI Compatible",
          baseURL: "https://example.com/v1",
          modelName: "gpt-image-1",
          label: "GPT Image 1",
          providerId: "openai",
          ability: "image",
          supportedAspectRatios: ["auto", "16:9", "9:16", "2:3", "3:2", "4:3", "3:4", "1:1"],
          defaultAspectRatio: "auto",
          defaultResolution: "auto"
        }
      ]
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(listImageCatalogMock).toHaveBeenCalledTimes(1);
    expect(json).toEqual({
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
          value: "1:1",
          label: "1:1",
          resolution: "1024x1024",
          width: 1024,
          height: 1024
        }
      ],
      providers: [
        {
          configId: "cfg_image",
          providerName: "OpenAI Compatible",
          baseURL: "https://example.com/v1",
          modelCount: 2
        }
      ],
      items: [
        {
          configId: "cfg_image",
          providerName: "OpenAI Compatible",
          baseURL: "https://example.com/v1",
          modelName: "gpt-image-1",
          label: "GPT Image 1",
          providerId: "openai",
          ability: "image",
          supportedAspectRatios: ["auto", "16:9", "9:16", "2:3", "3:2", "4:3", "3:4", "1:1"],
          defaultAspectRatio: "auto",
          defaultResolution: "auto"
        }
      ]
    });
  });
});
