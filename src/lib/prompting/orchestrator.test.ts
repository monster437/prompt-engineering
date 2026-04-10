import { describe, expect, it } from "vitest";
import type { PromptOrchestratorInput } from "@/lib/prompting/contracts";

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

describe("PromptOrchestratorInput", () => {
  it("accepts the Task 9 optimize orchestration shape", () => {
    const input = buildInput();

    expect(input.workspace.selectedTargetType).toBe("general");
    expect(input.provider.model).toBe("gpt-4.1-mini");
  });
});
