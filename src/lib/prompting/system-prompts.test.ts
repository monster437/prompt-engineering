import { describe, expect, it } from "vitest";
import {
  buildInterviewSystemPrompt,
  buildOptimizeSystemPrompt,
  buildReversePromptSystemPrompt,
  buildRefineSystemPrompt
} from "@/lib/prompting/system-prompts";

describe("system prompts", () => {
  it("includes target type, language, and JSON contract instructions in optimize prompts", () => {
    const prompt = buildOptimizeSystemPrompt({
      outputLanguage: "en",
      targetType: '{"styleTags":["xianxia","scene-narrative"],"cameraOrientation":"auto"}',
      aspectRatio: "16:9"
    });

    expect(prompt).toContain("玄幻修仙");
    expect(prompt).toContain("场景叙事");
    expect(prompt).toContain("English");
    expect(prompt).toContain("16:9");
    expect(prompt).toContain("camera orientation");
    expect(prompt).toContain("远景小人物");
    expect(prompt).toContain("背影");
    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("summary");
    expect(prompt).toContain("contextSnapshot");
  });

  it("includes the stop-asking rule once interview rounds are exhausted", () => {
    const prompt = buildInterviewSystemPrompt({
      outputLanguage: "zh",
      targetType: '{"styleTags":["general"],"cameraOrientation":"back"}',
      aspectRatio: "9:16",
      canAskFollowUp: false
    });

    expect(prompt).toContain("通用");
    expect(prompt).toContain("中文");
    expect(prompt).toContain("9:16");
    expect(prompt).toContain("背影");
    expect(prompt).toContain("Do not ask another question");
  });

  it("includes refine-specific editing instructions", () => {
    const prompt = buildRefineSystemPrompt({
      outputLanguage: "zh",
      targetType: '{"styleTags":["cute-romance","soft-romance-light"],"cameraOrientation":"three-quarter"}',
      aspectRatio: "3:2"
    });

    expect(prompt).toContain("可爱言情");
    expect(prompt).toContain("柔光恋爱");
    expect(prompt).toContain("3:2");
    expect(prompt).toContain("3/4侧脸");
    expect(prompt).toContain("修改现有提示词");
    expect(prompt).toContain("Return JSON only");
  });

  it("includes reverse prompt inference instructions", () => {
    const prompt = buildReversePromptSystemPrompt({
      outputLanguage: "zh"
    });

    expect(prompt).toContain("reference images");
    expect(prompt).toContain("中文");
    expect(prompt).toContain("reverse-engineered");
    expect(prompt).toContain('"status":"completed"');
    expect(prompt).toContain("contextSnapshot");
    expect(prompt).toContain("finalPrompt");
  });
});
