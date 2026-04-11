import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_INTERVIEW_ROUNDS, PromptOrchestratorInput } from "@/lib/prompting/contracts";

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
      sourcePrompt: "一个女孩站在海边",
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

    const result = await runPromptOrchestration(buildInput());

    expect(result.finalPrompt).toBe("optimized prompt");
    expect(callProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        endpoint: "/v1/chat/completions",
        payload: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({ role: "user" })
          ])
        })
      })
    );
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
        sourcePrompt: "一个女孩站在海边",
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
        sourcePrompt: "一个女孩站在海边",
        questionMessages: ["服装风格？", "时间？", "镜头感？"],
        answers: ["白裙", "黄昏", "电影感"],
        finalPrompt: null,
        parameterSummary: null,
        refineInstruction: null
      }
    }));

    const providerInput = callProviderMock.mock.calls[0][0];
    const systemMessage = (providerInput.payload as { messages: Array<{ role: string; content: string }> }).messages[0];

    expect(MAX_INTERVIEW_ROUNDS).toBe(3);
    expect(systemMessage.content).toContain("Do not ask another question");
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
          sourcePrompt: "一个女孩站在海边",
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
});
