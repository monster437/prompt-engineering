import { describe, expect, it, vi } from "vitest";

import type { PromptSummary, WorkspaceDto } from "@/lib/types";

import { PromptResultPanel } from "./prompt-result-panel";

function makeSummary(overrides: Partial<PromptSummary> = {}): PromptSummary {
  return {
    style: "cinematic",
    scene: "rainy city street",
    time: "night",
    mood: "moody",
    quality: "high detail",
    composition: "wide shot",
    extras: ["neon reflections"],
    ...overrides
  };
}

function makeWorkspace(overrides: Partial<WorkspaceDto> = {}): WorkspaceDto {
  return {
    id: "ws_1",
    title: "Workspace 1",
    mode: "interview",
    outputLanguage: "zh",
    selectedTextModel: null,
    selectedTextConfig: null,
    selectedTargetType: "general",
    selectedImageModel: null,
    sourcePrompt: "A rainy neon street",
    questionMessages: [],
    answers: [],
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
    status: "idle",
    ...overrides
  };
}

describe("PromptResultPanel", () => {
  it("renders final prompt and structured summary", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({
        finalPrompt: "A cinematic rainy neon street with glowing reflections",
        parameterSummary: makeSummary()
      }),
      refineDraft: "",
      isCopying: false,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("最终提示词");
    expect(output).toContain("A cinematic rainy neon street with glowing reflections");
    expect(output).toContain("参数摘要");
    expect(output).toContain("cinematic");
    expect(output).toContain("rainy city street");
    expect(output).toContain("neon reflections");
  });

  it("shows empty state before a prompt is generated", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace(),
      refineDraft: "",
      isCopying: false,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("还没有生成结果。");
  });

  it("shows copy pending state", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({ finalPrompt: "Prompt" }),
      refineDraft: "Make it moodier",
      isCopying: true,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("复制中...");
    expect(output).toContain("Make it moodier");
  });

  it("wires refine draft and copy handlers", () => {
    const onRefineDraftChange = vi.fn();
    const onCopyPrompt = vi.fn();
    const html = PromptResultPanel({
      workspace: makeWorkspace({ finalPrompt: "Prompt" }),
      refineDraft: "",
      isCopying: false,
      onRefineDraftChange,
      onCopyPrompt
    });

    const header = html.props.children[0];
    const copyButton = header.props.children[1];
    const body = html.props.children[1];
    const refineSection = body.props.children[2];
    const refineField = refineSection.props.children[1];

    refineField.props.onChange({ target: { value: "Make it moodier" } });
    copyButton.props.onClick();

    expect(onRefineDraftChange).toHaveBeenCalledWith("Make it moodier");
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });
});
