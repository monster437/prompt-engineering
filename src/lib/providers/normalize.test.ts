import { describe, expect, it } from "vitest";
import { normalizeProviderResponse } from "@/lib/providers/normalize";

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
});
