import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_INTERVIEW_ROUNDS, PromptOrchestratorInput, ProviderMessage } from "@/lib/prompting/contracts";

const { callProviderMock } = vi.hoisted(() => ({
  callProviderMock: vi.fn()
}));

vi.mock("@/lib/providers/openai-compatible", () => ({
  callOpenAiCompatibleProvider: callProviderMock
}));

import { runPromptOrchestration } from "@/lib/prompting/orchestrator";

function buildInput(overrides: Partial<PromptOrchestratorInput> = {}): PromptOrchestratorInput {
  return {
    action: "optimize",
    workspace: {
      mode: "optimize",
      outputLanguage: "zh",
      selectedTargetType: "general",
      selectedImageAspectRatio: "auto",
      sourcePrompt: "一个女孩站在海边",
      sourcePromptImages: [],
      questionMessages: [],
      answers: [],
      finalPrompt: null,
      parameterSummary: null,
      refineInstruction: null
    },
    provider: {
      endpoint: "/v1/chat/completions",
      baseURL: "https://example.com",
      apiKey: "sk-test",
      model: "gpt-4.1-mini"
    },
    ...overrides
  };
}

afterEach(() => {
  callProviderMock.mockReset();
});

describe("runPromptOrchestration", () => {
  it("runs optimize through the provider and returns the normalized result", async () => {
    callProviderMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "optimized prompt with 2:5 framing",
      summary: {
        style: "cinematic",
        scene: "beach",
        time: "sunset",
        mood: "calm",
        quality: "high detail",
        composition: "2:5 wide shot",
        extras: []
      },
      contextSnapshot: { subject: "girl" }
    });

    const result = await runPromptOrchestration(buildInput({
      workspace: {
        mode: "optimize",
        outputLanguage: "zh",
        selectedTargetType: '{"styleTags":["xianxia"],"cameraOrientation":"back"}',
        selectedImageAspectRatio: "16:9",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: [],
        questionMessages: [],
        answers: [],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null
      }
    }));

    expect(result.finalPrompt).toBe("optimized prompt with 16:9 framing");
    expect(result.summary?.composition).toBe("16:9 wide shot");
    expect(callProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        endpoint: "/v1/chat/completions",
        payload: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system", content: expect.stringContaining("16:9") }),
            expect.objectContaining({ role: "user", content: expect.stringContaining("Selected aspect ratio:\n16:9") }),
            expect.objectContaining({ role: "user", content: expect.stringContaining("Selected camera orientation:\n背影") })
          ])
        })
      })
    );
  });

  it("includes uploaded reference images in the user message content", async () => {
    callProviderMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "optimized prompt",
      summary: {
        style: "cinematic",
        scene: "beach",
        time: "sunset",
        mood: "calm",
        quality: "high detail",
        composition: "wide shot",
        extras: []
      },
      contextSnapshot: { subject: "girl" }
    });

    await runPromptOrchestration(buildInput({
      workspace: {
        mode: "optimize",
        outputLanguage: "zh",
        selectedTargetType: "general",
        selectedImageAspectRatio: "auto",
        sourcePrompt: "",
        sourcePromptImages: [
          {
            id: "img_1",
            name: "ref.png",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA",
            sizeBytes: 128
          }
        ],
        questionMessages: [],
        answers: [],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null
      }
    }));

    const providerInput = callProviderMock.mock.calls[0][0];
    const messages = (providerInput.payload as { messages: ProviderMessage[] }).messages;
    const userMessage = messages[1];

    expect(Array.isArray(userMessage.content)).toBe(true);
    expect(userMessage.content).toEqual([
      expect.objectContaining({
        type: "text",
        text: expect.stringContaining("Reference images attached:\n1")
      }),
      expect.objectContaining({
        type: "image_url",
        image_url: expect.objectContaining({
          url: "data:image/png;base64,AAAA"
        })
      })
    ]);
  });

  it("allows interview clarification before the round limit", async () => {
    callProviderMock.mockResolvedValue({
      status: "needs_clarification",
      question: "主角穿什么风格的衣服？",
      contextSnapshot: { missing: ["wardrobe"] }
    });

    const result = await runPromptOrchestration(buildInput({
      action: "interview",
      workspace: {
        mode: "interview",
        outputLanguage: "zh",
        selectedTargetType: "general",
        selectedImageAspectRatio: "auto",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: [],
        questionMessages: [],
        answers: [],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null
      }
    }));

    expect(result.status).toBe("needs_clarification");
    expect(result.question).toBe("主角穿什么风格的衣服？");
  });

  it("forces interview prompts to stop asking once the round limit is reached", async () => {
    callProviderMock.mockResolvedValue({
      status: "completed",
      finalPrompt: "final interview prompt",
      summary: {
        style: "cinematic",
        scene: "beach",
        time: "sunset",
        mood: "calm",
        quality: "high detail",
        composition: "wide shot",
        extras: []
      },
      contextSnapshot: { subject: "girl" }
    });

    await runPromptOrchestration(buildInput({
      action: "interview",
      workspace: {
        mode: "interview",
        outputLanguage: "zh",
        selectedTargetType: "general",
        selectedImageAspectRatio: "auto",
        sourcePrompt: "一个女孩站在海边",
        sourcePromptImages: [],
        questionMessages: ["服装风格？", "时间？", "镜头感？"],
        answers: ["白裙", "黄昏", "电影感"],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null
      }
    }));

    const providerInput = callProviderMock.mock.calls[0][0];
    const systemMessage = (providerInput.payload as { messages: ProviderMessage[] }).messages[0];

    expect(MAX_INTERVIEW_ROUNDS).toBe(3);
    expect(typeof systemMessage.content === "string" ? systemMessage.content : "").toContain("Do not ask another question");
  });

  it("throws if refine returns a clarification response", async () => {
    callProviderMock.mockResolvedValue({
      status: "needs_clarification",
      question: "补充一下风格",
      contextSnapshot: {}
    });

    await expect(
      runPromptOrchestration(buildInput({
        action: "refine",
        workspace: {
          mode: "optimize",
          outputLanguage: "zh",
          selectedTargetType: "general",
          selectedImageAspectRatio: "16:9",
          sourcePrompt: "一个女孩站在海边",
          sourcePromptImages: [],
          questionMessages: [],
          answers: [],
          finalPrompt: "old prompt",
          parameterSummary: {
            style: "cinematic",
            scene: "beach",
            time: "sunset",
            mood: "calm",
            quality: "high detail",
            composition: "wide shot",
            extras: []
          },
          refineInstruction: "改成雨夜"
        }
      }))
    ).rejects.toThrow("Refine must return a completed result");
  });

  it("throws if optimize returns a clarification response", async () => {
    callProviderMock.mockResolvedValue({
      status: "needs_clarification",
      question: "补充一下风格",
      contextSnapshot: {}
    });

    await expect(runPromptOrchestration(buildInput())).rejects.toThrow(
      "Optimize must return a completed result"
    );
  });

  it("throws if interview still returns clarification after the round limit", async () => {
    callProviderMock.mockResolvedValue({
      status: "needs_clarification",
      question: "还想再确认一下光线",
      contextSnapshot: {}
    });

    await expect(
      runPromptOrchestration(buildInput({
        action: "interview",
        workspace: {
          mode: "interview",
          outputLanguage: "zh",
          selectedTargetType: "general",
          selectedImageAspectRatio: "auto",
          sourcePrompt: "一个女孩站在海边",
          sourcePromptImages: [],
          questionMessages: ["服装风格？", "时间？", "镜头感？"],
          answers: ["白裙", "黄昏", "电影感"],
          finalPrompt: null,
          parameterSummary: null,
          refineInstruction: null
        }
      }))
    ).rejects.toThrow("Interview must return a completed result after the round limit");
  });
});
