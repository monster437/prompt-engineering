import { describe, expect, it, vi } from "vitest";

import type { WorkspaceDto } from "@/lib/types";

import { FollowUpPanel } from "./follow-up-panel";

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

describe("FollowUpPanel", () => {
  it("renders question and answer history", () => {
    const html = FollowUpPanel({
      workspace: makeWorkspace({
        questionMessages: ["What style should it have?", "What time of day?"],
        answers: ["Cinematic", "Blue hour"]
      }),
      pendingQuestion: "What camera angle do you want?",
      draftAnswer: "",
      isSubmittingAnswer: false,
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("追问区");
    expect(output).toContain("What style should it have?");
    expect(output).toContain("Cinematic");
    expect(output).toContain("What time of day?");
    expect(output).toContain("Blue hour");
    expect(output).toContain("What camera angle do you want?");
  });

  it("shows empty state when there is no interview history", () => {
    const html = FollowUpPanel({
      workspace: makeWorkspace(),
      pendingQuestion: null,
      draftAnswer: "",
      isSubmittingAnswer: false,
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("暂时还没有追问。");
  });

  it("shows submit pending state", () => {
    const html = FollowUpPanel({
      workspace: makeWorkspace(),
      pendingQuestion: "What style should it have?",
      draftAnswer: "Cinematic",
      isSubmittingAnswer: true,
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("提交中...");
    expect(output).toContain("Cinematic");
  });

  it("wires draft change and submit handlers", () => {
    const onDraftAnswerChange = vi.fn();
    const onSubmitAnswer = vi.fn();
    const html = FollowUpPanel({
      workspace: makeWorkspace(),
      pendingQuestion: "What style should it have?",
      draftAnswer: "",
      isSubmittingAnswer: false,
      onDraftAnswerChange,
      onSubmitAnswer
    });

    const currentQuestionSection = html.props.children[2];
    const answerField = currentQuestionSection.props.children[1];
    const answerBox = answerField.props.children[1];
    const submitButton = currentQuestionSection.props.children[2];

    answerBox.props.onChange({ target: { value: "Cinematic" } });
    submitButton.props.onClick();

    expect(onDraftAnswerChange).toHaveBeenCalledWith("Cinematic");
    expect(onSubmitAnswer).toHaveBeenCalledTimes(1);
  });
});
