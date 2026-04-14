import { describe, expect, it, vi } from "vitest";
import React from "react";

import type { ModelOptionDto, PromptSummary, WorkspaceDto } from "@/lib/types";

import { WorkbenchShell } from "./workbench-shell";

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

function makeModel(overrides: Partial<ModelOptionDto> = {}): ModelOptionDto {
  return {
    configId: "cfg_text_1",
    configType: "text",
    providerName: "OpenAI",
    modelName: "gpt-4.1",
    label: "OpenAI / gpt-4.1",
    ...overrides
  };
}

describe("WorkbenchShell", () => {
  it("renders the major workbench sections", () => {
    const html = WorkbenchShell({
      workspaces: [
        makeWorkspace({
          finalPrompt: "A cinematic rainy neon street",
          parameterSummary: makeSummary(),
          questionMessages: ["What style should it have?"],
          answers: ["Cinematic"]
        })
      ],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      pendingQuestion: "What camera angle do you want?",
      draftAnswer: "",
      refineDraft: "",
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isSubmittingAnswer: false,
      isCopying: false,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    const shellBody = html.props.children.props.children;
    const header = shellBody[0];
    const layout = shellBody[1];
    const sidebar = layout.props.children[0];
    const content = layout.props.children[1];
    const primaryColumnChildren = React.Children.toArray(content.props.children[0].props.children);

    expect(header.props.children[0].props.children[0].props.children).toBe("提示词工作台");
    expect(sidebar.props.children.type.name).toBe("WorkspaceList");
    expect(primaryColumnChildren[0].type.name).toBe("WorkspaceEditor");
    expect(primaryColumnChildren[1].type.name).toBe("FollowUpPanel");
    expect(content.props.children[1].type.name).toBe("PromptResultPanel");
  });

  it("shows empty selection state when no active workspace exists", () => {
    const html = WorkbenchShell({
      workspaces: [],
      activeWorkspaceId: null,
      modelOptions: [],
      pendingQuestion: null,
      draftAnswer: "",
      refineDraft: "",
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isSubmittingAnswer: false,
      isCopying: false,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    const shellBody = html.props.children.props.children;
    const emptyState = shellBody[1].props.children[1];

    expect(emptyState.props.children).toBe("请选择一个工作台，或先创建一个新的工作台。");
  });

  it("renders an inline error banner when provided", () => {
    const html = WorkbenchShell({
      workspaces: [makeWorkspace()],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      pendingQuestion: null,
      draftAnswer: "",
      refineDraft: "",
      errorMessage: "Provider request failed with 401",
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isSubmittingAnswer: false,
      isCopying: false,
      onCreateWorkspace: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn()
    });

    const shellBody = html.props.children.props.children;
    const content = shellBody[1].props.children[1];
    const banner = content.props.children[0].props.children[1];

    expect(banner.props.children).toBe("Provider request failed with 401");
  });

  it("passes handlers through the composed panels", () => {
    const onCreateWorkspace = vi.fn();
    const onSelectWorkspace = vi.fn();
    const onPatchWorkspace = vi.fn();
    const onGeneratePrompt = vi.fn();
    const onSubmitAnswer = vi.fn();
    const onCopyPrompt = vi.fn();
    const html = WorkbenchShell({
      workspaces: [makeWorkspace({ questionMessages: ["What style should it have?"], answers: ["Cinematic"], finalPrompt: "Prompt" })],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      pendingQuestion: "What camera angle do you want?",
      draftAnswer: "",
      refineDraft: "",
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isSubmittingAnswer: false,
      isCopying: false,
      onCreateWorkspace,
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace,
      onPatchWorkspace,
      onGeneratePrompt,
      onRefinePrompt: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt
    });

    const shellBody = html.props.children.props.children;
    const layout = shellBody[1];
    const sidebar = layout.props.children[0];
    const content = layout.props.children[1];
    const primaryColumnChildren = React.Children.toArray(content.props.children[0].props.children);

    const listElement = sidebar.props.children;
    listElement.props.onCreateWorkspace();
    listElement.props.onSelectWorkspace("ws_1");

    const editorElement = primaryColumnChildren[0];
    editorElement.props.onPatchWorkspace({ mode: "optimize" });
    editorElement.props.onGeneratePrompt();

    const followUpElement = primaryColumnChildren[1];
    followUpElement.props.onSubmitAnswer();

    const resultElement = content.props.children[1];
    resultElement.props.onCopyPrompt();

    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    expect(onSelectWorkspace).toHaveBeenCalledWith("ws_1");
    expect(onPatchWorkspace).toHaveBeenCalledWith({ mode: "optimize" });
    expect(onGeneratePrompt).toHaveBeenCalledTimes(1);
    expect(onSubmitAnswer).toHaveBeenCalledTimes(1);
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });
});
