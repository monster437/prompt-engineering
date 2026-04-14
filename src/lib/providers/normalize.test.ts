import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeProviderResponse } from "@/lib/providers/normalize";
import { callOpenAiCompatibleProvider } from "./openai-compatible";

afterEach(() => {
  vi.unstubAllGlobals();
});

function createEventStreamResponse(events: unknown[]) {
  const body = [
    ...events.map((event) => `data: ${typeof event === "string" ? event : JSON.stringify(event)}\n`),
    "data: [DONE]\n"
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream"
    }
  });
}

describe("normalizeProviderResponse", () => {
  it("normalizes chat completions output", () => {
    const result = normalizeProviderResponse({
      choices: [{ message: { content: '{"status":"completed","finalPrompt":"abc","contextSnapshot":{}}' } }]
    });

    expect(result.finalPrompt).toBe("abc");
  });

  it("normalizes fenced json output", () => {
    const result = normalizeProviderResponse({
      choices: [{ message: { content: '```json\n{"status":"completed","finalPrompt":"fenced","contextSnapshot":{}}\n```' } }]
    });

    expect(result.finalPrompt).toBe("fenced");
  });

  it("normalizes chat completions array content output", () => {
    const result = normalizeProviderResponse({
      choices: [
        {
          message: {
            content: [{ type: "text", text: '{"status":"completed","finalPrompt":"array-content","contextSnapshot":{}}' }]
          }
        }
      ]
    });

    expect(result.finalPrompt).toBe("array-content");
  });

  it("normalizes chat completions text field output", () => {
    const result = normalizeProviderResponse({
      choices: [{ text: '{"status":"completed","finalPrompt":"legacy-text","contextSnapshot":{}}' }]
    });

    expect(result.finalPrompt).toBe("legacy-text");
  });

  it("normalizes nested text.value output", () => {
    const result = normalizeProviderResponse({
      choices: [
        {
          message: {
            content: [
              {
                type: "text",
                text: {
                  value: '{"status":"completed","finalPrompt":"nested-value","contextSnapshot":{}}'
                }
              }
            ]
          }
        }
      ]
    });

    expect(result.finalPrompt).toBe("nested-value");
  });

  it("normalizes responses api output", () => {
    const result = normalizeProviderResponse({
      output: [{ type: "message", content: [{ type: "output_text", text: '{"status":"completed","finalPrompt":"xyz","contextSnapshot":{}}' }] }]
    });

    expect(result.finalPrompt).toBe("xyz");
  });

  it("finds a normalized result anywhere in the payload tree", () => {
    const result = normalizeProviderResponse({
      id: "resp_123",
      data: {
        foo: [
          { ignored: true },
          {
            bar: {
              baz: '{"status":"completed","finalPrompt":"deep-tree","contextSnapshot":{}}'
            }
          }
        ]
      }
    });

    expect(result.finalPrompt).toBe("deep-tree");
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }],
          model: "gpt-4.1-mini",
          response_format: {
            type: "json_object"
          }
        })
      })
    );
  });

  it("avoids duplicating /v1 when the configured base URL already ends with it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"status":"completed","finalPrompt":"abc","contextSnapshot":{}}' } }]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    await callOpenAiCompatibleProvider({
      endpoint: "/v1/chat/completions",
      baseURL: "https://api.openai.com/v1",
      apiKey: "sk-test",
      model: "gpt-4.1-mini",
      payload: {
        messages: [{ role: "user", content: "hello" }]
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        body: JSON.stringify({
          messages: [{ role: "user", content: "hello" }],
          model: "gpt-4.1-mini",
          response_format: {
            type: "json_object"
          }
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
          messages: [{ role: "user", content: "hello" }],
          response_format: {
            type: "json_object"
          }
        })
      })
    );
  });

  it("falls back to the responses api when chat completions returns null content", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "chat.completion",
          choices: [{ message: { content: null } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output: [{ type: "message", content: [{ type: "output_text", text: '{"status":"completed","finalPrompt":"from-responses","contextSnapshot":{}}' }] }]
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenAiCompatibleProvider({
      endpoint: "/v1/chat/completions",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-5.2",
      payload: {
        messages: [
          { role: "system", content: "Return JSON only" },
          { role: "user", content: "hello" }
        ]
      }
    });

    expect(result.finalPrompt).toBe("from-responses");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example.com/v1/responses",
      expect.objectContaining({
        body: JSON.stringify({
          model: "gpt-5.2",
          instructions: "Return JSON only",
          input: "Respond in JSON.\n\nhello",
          text: {
            format: {
              type: "json_object"
            }
          }
        })
      })
    );
  });

  it("includes responses api error details when fallback request fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "chat.completion",
          choices: [{ message: { content: null } }]
        })
      })
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "responses unsupported" } }), { status: 400 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callOpenAiCompatibleProvider({
        endpoint: "/v1/chat/completions",
        baseURL: "https://example.com",
        apiKey: "sk-test",
        model: "gpt-5.2",
        payload: {
          messages: [{ role: "user", content: "hello" }]
        }
      })
    ).rejects.toThrow(/responses unsupported/);
  });

  it("falls back to the responses event stream when the non-stream response has empty output", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "chat.completion",
          choices: [{ message: { content: null } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "response",
          status: "completed",
          output: []
        })
      })
      .mockResolvedValueOnce(
        createEventStreamResponse([
          {
            type: "response.output_text.delta",
            delta: '{"status":"completed","finalPrompt":"from-stream","contextSnapshot":{}}'
          }
        ])
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await callOpenAiCompatibleProvider({
      endpoint: "/v1/chat/completions",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-5.2",
      payload: {
        messages: [{ role: "user", content: "hello" }]
      }
    });

    expect(result.finalPrompt).toBe("from-stream");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://example.com/v1/responses",
      expect.objectContaining({
        body: JSON.stringify({
          model: "gpt-5.2",
          input: "Respond in JSON.\n\nhello",
          text: {
            format: {
              type: "json_object"
            }
          },
          stream: true
        })
      })
    );
  });

  it("includes a specific error when responses completes without textual output and stream fallback is empty", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "chat.completion",
          choices: [{ message: { content: null } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "response",
          status: "completed",
          output: []
        })
      })
      .mockResolvedValueOnce(createEventStreamResponse([]));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callOpenAiCompatibleProvider({
        endpoint: "/v1/chat/completions",
        baseURL: "https://example.com",
        apiKey: "sk-test",
        model: "gpt-5.2",
        payload: {
          messages: [{ role: "user", content: "hello" }]
        }
      })
    ).rejects.toThrow(/Responses API completed without textual output.*Raw stream preview:/s);
  });

  it("includes a raw response preview when normalization still fails after fallback", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          object: "chat.completion",
          choices: [{ message: { content: null } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          weird: { nested: ["not-json"] }
        })
      })
      .mockResolvedValueOnce(
        createEventStreamResponse([
          {
            type: "response.output_text.delta",
            delta: "not-json"
          }
        ])
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callOpenAiCompatibleProvider({
        endpoint: "/v1/chat/completions",
        baseURL: "https://example.com",
        apiKey: "sk-test",
        model: "gpt-5.2",
        payload: {
          messages: [{ role: "user", content: "hello" }]
        }
      })
    ).rejects.toThrow(/Raw response preview:.*Raw stream preview:/s);
  });
});
