import { describe, expect, it } from "vitest";
import {
  buildInterviewSystemPrompt,
  buildOptimizeSystemPrompt,
  buildRefineSystemPrompt
} from "@/lib/prompting/system-prompts";

describe("system prompts", () => {
  it("includes target type, language, and JSON contract instructions in optimize prompts", () => {
    const prompt = buildOptimizeSystemPrompt({
      outputLanguage: "en",
      targetType: "jimeng"
    });

    expect(prompt).toContain("jimeng");
    expect(prompt).toContain("English");
    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("summary");
    expect(prompt).toContain("contextSnapshot");
  });

  it("includes the stop-asking rule once interview rounds are exhausted", () => {
    const prompt = buildInterviewSystemPrompt({
      outputLanguage: "zh",
      targetType: "general",
      canAskFollowUp: false
    });

    expect(prompt).toContain("general");
    expect(prompt).toContain("中文");
    expect(prompt).toContain("Do not ask another question");
  });

  it("includes refine-specific editing instructions", () => {
    const prompt = buildRefineSystemPrompt({
      outputLanguage: "zh",
      targetType: "grok"
    });

    expect(prompt).toContain("grok");
    expect(prompt).toContain("修改现有提示词");
    expect(prompt).toContain("Return JSON only");
  });
});
