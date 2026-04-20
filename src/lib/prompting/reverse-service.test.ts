import { afterEach, describe, expect, it, vi } from "vitest";

const {
  findConfigMock,
  decryptSecretMock,
  callOpenAiCompatibleProviderMock
} = vi.hoisted(() => ({
  findConfigMock: vi.fn(),
  decryptSecretMock: vi.fn(),
  callOpenAiCompatibleProviderMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    providerConfig: {
      findUniqueOrThrow: findConfigMock
    }
  }
}));

vi.mock("@/lib/security/crypto", () => ({
  decryptSecret: decryptSecretMock
}));

vi.mock("@/lib/providers/openai-compatible", () => ({
  callOpenAiCompatibleProvider: callOpenAiCompatibleProviderMock
}));

import { runReversePromptInference } from "@/lib/prompting/reverse-service";

afterEach(() => {
  findConfigMock.mockReset();
  decryptSecretMock.mockReset();
  callOpenAiCompatibleProviderMock.mockReset();
});

describe("runReversePromptInference", () => {
  it("loads config, calls the provider, and returns a completed prompt result", async () => {
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    callOpenAiCompatibleProviderMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "cinematic portrait prompt",
      summary: {
        style: "cinematic",
        scene: "portrait in a studio",
        time: "soft daylight",
        mood: "calm",
        quality: "high detail",
        composition: "close-up portrait",
        extras: ["cream backdrop"]
      },
      contextSnapshot: {
        imageCount: 2,
        observedSubjects: ["person"]
      }
    });

    const result = await runReversePromptInference({
      selectedConfigId: "cfg_text",
      selectedTextModel: "gpt-4.1",
      outputLanguage: "zh",
      sourcePromptImages: [
        {
          id: "img_1",
          name: "ref-1.png",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AAAA",
          sizeBytes: 128
        },
        {
          id: "img_2",
          name: "ref-2.png",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,BBBB",
          sizeBytes: 256
        }
      ],
      userInstruction: "更偏电影感"
    });

    expect(result.finalPrompt).toBe("cinematic portrait prompt");
    expect(callOpenAiCompatibleProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1",
        baseURL: "https://example.com",
        apiKey: "sk-test",
        payload: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining("reference images")
            }),
            expect.objectContaining({
              role: "user",
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: "text",
                  text: expect.stringContaining("Image count: 2")
                }),
                expect.objectContaining({
                  type: "image_url",
                  image_url: expect.objectContaining({
                    url: "data:image/png;base64,AAAA"
                  })
                })
              ])
            })
          ])
        })
      })
    );
  });

  it("throws when the selected config is not text", async () => {
    findConfigMock.mockResolvedValue({
      id: "cfg_image",
      type: "IMAGE",
      providerName: "OpenAI Compatible",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });

    await expect(
      runReversePromptInference({
        selectedConfigId: "cfg_image",
        selectedTextModel: "gpt-4.1",
        outputLanguage: "zh",
        sourcePromptImages: [
          {
            id: "img_1",
            name: "ref.png",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA",
            sizeBytes: 128
          }
        ],
        userInstruction: ""
      })
    ).rejects.toThrow(/text config/i);

    expect(callOpenAiCompatibleProviderMock).not.toHaveBeenCalled();
  });

  it("throws when the provider does not return a completed result", async () => {
    findConfigMock.mockResolvedValue({
      id: "cfg_text",
      type: "TEXT",
      providerName: "OpenRouter",
      baseUrl: "https://example.com",
      apiKey: "encrypted-key",
      modelsJson: "[]"
    });
    decryptSecretMock.mockReturnValue("sk-test");
    callOpenAiCompatibleProviderMock.mockResolvedValue({
      status: "needs_clarification",
      question: "ignored",
      contextSnapshot: {}
    });

    await expect(
      runReversePromptInference({
        selectedConfigId: "cfg_text",
        selectedTextModel: "gpt-4.1",
        outputLanguage: "zh",
        sourcePromptImages: [
          {
            id: "img_1",
            name: "ref.png",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA",
            sizeBytes: 128
          }
        ],
        userInstruction: ""
      })
    ).rejects.toThrow(/completed result/i);
  });
});
