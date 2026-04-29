import { afterEach, describe, expect, it, vi } from "vitest";

import { callOpenAiCompatibleImageProvider } from "@/lib/providers/openai-compatible";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("callOpenAiCompatibleImageProvider", () => {
  it("sends both exact size and aspect ratio for grok-imagine precise options", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({
        data: [{ url: "https://example.com/generated.png" }]
      }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleImageProvider({
      endpoint: "/v1/images/generations",
      baseURL: "https://example.com/v1",
      apiKey: "sk-test",
      model: "grok-imagine-1.0",
      aspectRatio: "16:9@1280x720",
      prompt: "test prompt"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/images/generations",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      model: "grok-imagine-1.0",
      prompt: "test prompt",
      aspect_ratio: "16:9",
      size: "1280x720"
    });
  });

  it("sends ratio-only options through aspect_ratio for grok-imagine requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({
        data: [{ url: "https://example.com/generated.png" }]
      }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleImageProvider({
      endpoint: "/v1/images/generations",
      baseURL: "https://example.com/v1",
      apiKey: "sk-test",
      model: "grok-imagine-1.0",
      aspectRatio: "3:2",
      prompt: "test prompt"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/images/generations",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      model: "grok-imagine-1.0",
      prompt: "test prompt",
      aspect_ratio: "3:2"
    });
  });

  it("omits size and aspect ratio for auto requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({
        data: [{ url: "https://example.com/generated.png" }]
      }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleImageProvider({
      endpoint: "/v1/images/generations",
      baseURL: "https://example.com/v1",
      apiKey: "sk-test",
      model: "grok-imagine-1.0",
      aspectRatio: "auto",
      prompt: "test prompt"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          model: "grok-imagine-1.0",
          prompt: "test prompt"
        })
      })
    );
  });
});
