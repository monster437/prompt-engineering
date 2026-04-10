import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeProviderResponse } from "@/lib/providers/normalize";
import { callOpenAiCompatibleProvider } from "./openai-compatible";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeProviderResponse", () => {
  it("normalizes chat completions output", () => {
    const result = normalizeProviderResponse({
      choices: [{ message: { content: '{"status":"completed","finalPrompt":"abc","contextSnapshot":{}}' } }]
    });

    expect(result.finalPrompt).toBe("abc");
  });

  it("normalizes responses api output", () => {
    const result = normalizeProviderResponse({
      output: [{ type: "message", content: [{ type: "output_text", text: '{"status":"completed","finalPrompt":"xyz","contextSnapshot":{}}' }] }]
    });

    expect(result.finalPrompt).toBe("xyz");
  });

  it("finds responses api message output beyond the first item", () => {
    const result = normalizeProviderResponse({
      output: [
        { type: "reasoning", content: [] },
        { type: "message", content: [{ type: "output_text", text: '{"status":"completed","finalPrompt":"later","contextSnapshot":{}}' }] }
      ]
    });

    expect(result.finalPrompt).toBe("later");
  });

  it("finds responses api output_text in a later message item", () => {
    const result = normalizeProviderResponse({
      output: [
        { type: "message", content: [{ type: "input_text", text: "ignored" }] },
        { type: "message", content: [{ type: "output_text", text: '{"status":"completed","finalPrompt":"deep-later","contextSnapshot":{}}' }] }
      ]
    });

    expect(result.finalPrompt).toBe("deep-later");
  });
});

describe("callOpenAiCompatibleProvider", () => {
  it("injects the invocation model into the request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"completed","finalPrompt":"abc","contextSnapshot":{}}' } }]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleProvider({
      endpoint: "/v1/chat/completions",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-4.1-mini",
      payload: {
        messages: [{ role: "user", content: "hello" }]
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }],
          model: "gpt-4.1-mini"
        })
      })
    );
  });

  it("invocation model overrides any payload model", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"completed","finalPrompt":"abc","contextSnapshot":{}}' } }]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleProvider({
      endpoint: "/v1/chat/completions",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-4.1-mini",
      payload: {
        model: "wrong-model",
        messages: [{ role: "user", content: "hello" }]
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: "hello" }]
        })
      })
    );
  });
});
