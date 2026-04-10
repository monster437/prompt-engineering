import { afterEach, describe, expect, it } from "vitest";
import { toConfigDto } from "@/lib/configs";
import { encryptSecret } from "@/lib/security/crypto";

const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY;

afterEach(() => {
  if (originalEncryptionKey === undefined) {
    delete process.env.APP_ENCRYPTION_KEY;
    return;
  }

  process.env.APP_ENCRYPTION_KEY = originalEncryptionKey;
});

describe("toConfigDto", () => {
  it("returns a masked config dto", () => {
    process.env.APP_ENCRYPTION_KEY = "change-me-to-32-chars-minimum!!!";

    const dto = toConfigDto({
      id: "cfg_1",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://openrouter.ai/api",
      apiKey: encryptSecret("sk-1234567890abcd"),
      modelsJson: JSON.stringify([{ modelName: "gpt-4.1-mini", label: "gpt-4.1-mini" }])
    });

    expect(dto).toEqual({
      id: "cfg_1",
      type: "text",
      providerName: "OpenRouter",
      baseURL: "https://openrouter.ai/api",
      apiKeyMasked: "*************abcd",
      models: [{ modelName: "gpt-4.1-mini", label: "gpt-4.1-mini" }]
    });
  });
});
