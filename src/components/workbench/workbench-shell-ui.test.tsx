import { describe, expect, it, vi } from "vitest";
import React from "react";

import type { GenerateImageResult, ModelOptionDto, PromptSummary, WorkspaceDto } from "@/lib/types";

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
    selectedImageConfig: null,
    selectedImageAspectRatio: "auto",
    selectedImageModel: null,
    sourcePrompt: "A rainy neon street",
    sourcePromptImages: [],
    questionMessages: [],
    answers: [],
    finalPrompt: null,
    parameterSummary: null,
    refineInstruction: null,
    generatedImageResult: null,
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

function makeImageResult(overrides: Partial<GenerateImageResult> = {}): GenerateImageResult {
  return {
    images: [{ url: "https://example.com/generated.png" }],
    revisedPrompt: "A rainy neon street at night",
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
      workspaceActivityById: { ws_1: "idle" },
      pendingQuestion: "What camera angle do you want?",
      draftAnswer: "",
      refineDraft: "",
      imageResult: makeImageResult(),
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      isSubmittingAnswer: false,
      isCopying: false,
      isConfigDrawerOpen: false,
      onCreateWorkspace: vi.fn(),
      onOpenConfigDrawer: vi.fn(),
      onCloseConfigDrawer: vi.fn(),
      onConfigsChanged: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onClearLogs: vi.fn()
    });

    const mainChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const shellBody = mainChildren[0].props.children;
    const header = shellBody[0];
    const layout = shellBody[1];
    const layoutChildren = React.Children.toArray(layout.props.children) as React.ReactElement<any>[];
    const sidebar = layoutChildren[0];
    const editorColumn = layoutChildren[1];
    const resultColumn = layoutChildren[2];
    const primaryColumnChildren = React.Children.toArray(editorColumn.props.children) as React.ReactElement<any>[];

    expect(header.props.children[0].props.children[0].props.children).toBe("提示词工作台");
    expect(header.props.children[1].props.children[0].props.href).toBe("/reverse");
    expect(sidebar.props.children.type.name).toBe("WorkspaceList");
    expect(((primaryColumnChildren[0] as React.ReactElement<any>).type as any).name).toBe("WorkspaceEditor");
    expect(((primaryColumnChildren[1] as React.ReactElement<any>).type as any).name).toBe("FollowUpPanel");
    expect(((primaryColumnChildren[2] as React.ReactElement<any>).type as any).name).toBe("WorkbenchLogPanel");
    expect(resultColumn.props.children.type.name).toBe("PromptResultPanel");
  });

  it("shows empty selection state when no active workspace exists", () => {
    const html = WorkbenchShell({
      workspaces: [],
      activeWorkspaceId: null,
      modelOptions: [],
      workspaceActivityById: {},
      pendingQuestion: null,
      draftAnswer: "",
      refineDraft: "",
      imageResult: null,
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      isSubmittingAnswer: false,
      isCopying: false,
      isConfigDrawerOpen: false,
      onCreateWorkspace: vi.fn(),
      onOpenConfigDrawer: vi.fn(),
      onCloseConfigDrawer: vi.fn(),
      onConfigsChanged: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onClearLogs: vi.fn()
    });

    const mainChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const shellBody = mainChildren[0].props.children;
    const layoutChildren = React.Children.toArray(shellBody[1].props.children) as React.ReactElement<any>[];
    const emptyState = layoutChildren[1];

    expect(emptyState.props.children).toBe("请选择一个工作台，或先创建一个新的工作台。");
  });

  it("renders an inline error banner when provided", () => {
    const html = WorkbenchShell({
      workspaces: [makeWorkspace()],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      workspaceActivityById: { ws_1: "error" },
      pendingQuestion: null,
      draftAnswer: "",
      refineDraft: "",
      imageResult: null,
      errorMessage: "Provider request failed with 401",
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      isSubmittingAnswer: false,
      isCopying: false,
      isConfigDrawerOpen: false,
      onCreateWorkspace: vi.fn(),
      onOpenConfigDrawer: vi.fn(),
      onCloseConfigDrawer: vi.fn(),
      onConfigsChanged: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onClearLogs: vi.fn()
    });

    const mainChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const shellBody = mainChildren[0].props.children;
    const layoutChildren = React.Children.toArray(shellBody[1].props.children) as React.ReactElement<any>[];
    const editorColumn = layoutChildren[1];
    const banner = editorColumn.props.children[1];

    expect(banner.props.children).toBe("Provider request failed with 401");
  });

  it("passes handlers through the composed panels", () => {
    const onCreateWorkspace = vi.fn();
    const onSelectWorkspace = vi.fn();
    const onPatchWorkspace = vi.fn();
    const onGeneratePrompt = vi.fn();
    const onStopGeneratePrompt = vi.fn();
    const onGenerateImage = vi.fn();
    const onStopGenerateImage = vi.fn();
    const onDiagnoseImage = vi.fn();
    const onSubmitAnswer = vi.fn();
    const onCopyPrompt = vi.fn();
    const onClearLogs = vi.fn();
    const onOpenConfigDrawer = vi.fn();
    const html = WorkbenchShell({
      workspaces: [makeWorkspace({ questionMessages: ["What style should it have?"], answers: ["Cinematic"], finalPrompt: "Prompt" })],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      workspaceActivityById: { ws_1: "idle" },
      pendingQuestion: "What camera angle do you want?",
      draftAnswer: "",
      refineDraft: "",
      imageResult: null,
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      isSubmittingAnswer: false,
      isCopying: false,
      isConfigDrawerOpen: false,
      onCreateWorkspace,
      onOpenConfigDrawer,
      onCloseConfigDrawer: vi.fn(),
      onConfigsChanged: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace,
      onPatchWorkspace,
      onGeneratePrompt,
      onStopGeneratePrompt,
      onRefinePrompt: vi.fn(),
      onGenerateImage,
      onStopGenerateImage,
      onDiagnoseImage,
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt,
      onClearLogs
    });

    const mainChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const shellBody = mainChildren[0].props.children;
    const header = shellBody[0];
    const layout = shellBody[1];
    const layoutChildren = React.Children.toArray(layout.props.children) as React.ReactElement<any>[];
    const sidebar = layoutChildren[0];
    const editorColumn = layoutChildren[1];
    const resultColumn = layoutChildren[2];
    const primaryColumnChildren = React.Children.toArray(editorColumn.props.children) as React.ReactElement<any>[];
    const headerButton = header.props.children[1].props.children[1];

    headerButton.props.onClick();
    const listElement = sidebar.props.children;
    listElement.props.onCreateWorkspace();
    listElement.props.onSelectWorkspace("ws_1");

    const editorElement = primaryColumnChildren[0] as React.ReactElement<any>;
    editorElement.props.onPatchWorkspace({ mode: "optimize" });
    editorElement.props.onGeneratePrompt();

    const followUpElement = primaryColumnChildren[1] as React.ReactElement<any>;
    followUpElement.props.onSubmitAnswer();

    const logElement = primaryColumnChildren[2] as React.ReactElement<any>;
    logElement.props.onClearLogs();

    const resultElement = resultColumn.props.children;
    resultElement.props.onDiagnoseImage();
    resultElement.props.onGenerateImage();
    resultElement.props.onCopyPrompt();

    expect(onOpenConfigDrawer).toHaveBeenCalledTimes(1);
    expect(onCreateWorkspace).toHaveBeenCalledTimes(1);
    expect(onSelectWorkspace).toHaveBeenCalledWith("ws_1");
    expect(onPatchWorkspace).toHaveBeenCalledWith({ mode: "optimize" });
    expect(onGeneratePrompt).toHaveBeenCalledTimes(1);
    expect(onStopGeneratePrompt).not.toHaveBeenCalled();
    expect(onDiagnoseImage).toHaveBeenCalledTimes(1);
    expect(onGenerateImage).toHaveBeenCalledTimes(1);
    expect(onStopGenerateImage).not.toHaveBeenCalled();
    expect(onSubmitAnswer).toHaveBeenCalledTimes(1);
    expect(onClearLogs).toHaveBeenCalledTimes(1);
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });

  it("renders the config drawer when requested", () => {
    const html = WorkbenchShell({
      workspaces: [makeWorkspace()],
      activeWorkspaceId: "ws_1",
      modelOptions: [makeModel()],
      workspaceActivityById: { ws_1: "idle" },
      pendingQuestion: null,
      draftAnswer: "",
      refineDraft: "",
      imageResult: null,
      errorMessage: null,
      isCreating: false,
      isDeletingWorkspaceId: null,
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      isSubmittingAnswer: false,
      isCopying: false,
      isConfigDrawerOpen: true,
      onCreateWorkspace: vi.fn(),
      onOpenConfigDrawer: vi.fn(),
      onCloseConfigDrawer: vi.fn(),
      onConfigsChanged: vi.fn(),
      onDeleteWorkspace: vi.fn(),
      onSelectWorkspace: vi.fn(),
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn(),
      onDraftAnswerChange: vi.fn(),
      onSubmitAnswer: vi.fn(),
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onClearLogs: vi.fn()
    });

    const mainChildren = React.Children.toArray(html.props.children) as React.ReactElement<any>[];
    const drawer = mainChildren[1];

    expect((drawer.type as any).name).toBe("ConfigDrawer");
    expect(drawer.props.isOpen).toBe(true);
  });
});
