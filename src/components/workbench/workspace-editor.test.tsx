import { describe, expect, it, vi } from "vitest";

import type { ModelOptionDto, WorkspaceDto } from "@/lib/types";

import { WorkspaceEditor } from "./workspace-editor";

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

function makeTextModel(overrides: Partial<ModelOptionDto> = {}): ModelOptionDto {
  return {
    configId: "cfg_text_1",
    configType: "text",
    providerName: "OpenAI",
    modelName: "gpt-4.1",
    label: "OpenAI / gpt-4.1",
    ...overrides
  };
}

function makeImageModel(overrides: Partial<ModelOptionDto> = {}): ModelOptionDto {
  return {
    configId: "cfg_image_1",
    configType: "image",
    providerName: "Replicate",
    modelName: "flux-dev",
    label: "Replicate / flux-dev",
    ...overrides
  };
}

describe("WorkspaceEditor", () => {
  it("renders workspace field labels and current values", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace({
        mode: "optimize",
        outputLanguage: "en",
        selectedTargetType: "portrait",
        sourcePrompt: "A cinematic portrait"
      }),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Mode");
    expect(output).toContain("Output language");
    expect(output).toContain("Target type");
    expect(output).toContain("Source prompt");
    expect(output).toContain("optimize");
    expect(output).toContain("en");
    expect(output).toContain("portrait");
    expect(output).toContain("A cinematic portrait");
  });

  it("surfaces available text and image model options", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [
        makeTextModel({ configId: "cfg_text_2", modelName: "claude-sonnet-4-6", label: "Anthropic / claude-sonnet-4-6" }),
        makeImageModel({ configId: "cfg_image_2", modelName: "sdxl", label: "Replicate / sdxl" })
      ],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Anthropic / claude-sonnet-4-6");
    expect(output).toContain("Replicate / sdxl");
    expect(output).toContain("Text model");
    expect(output).toContain("Image model");
  });

  it("disables form actions according to pending state", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: true,
      isGenerating: true,
      isRefining: true,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Saving...");
    expect(output).toContain("Generating...");
    expect(output).toContain("Refining...");
  });

  it("exposes change and action handlers", () => {
    const onPatchWorkspace = vi.fn();
    const onGeneratePrompt = vi.fn();
    const onRefinePrompt = vi.fn();
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace,
      onGeneratePrompt,
      onRefinePrompt
    });

    const sections = html.props.children[1].props.children;
    const modeSelect = sections[0].props.children[1];
    const actionRow = sections[6];
    const generateButton = actionRow.props.children[0];
    const refineButton = actionRow.props.children[1];

    modeSelect.props.onChange({ target: { value: "optimize" } });
    generateButton.props.onClick();
    refineButton.props.onClick();

    expect(onPatchWorkspace).toHaveBeenCalledWith({ mode: "optimize" });
    expect(onGeneratePrompt).toHaveBeenCalledTimes(1);
    expect(onRefinePrompt).toHaveBeenCalledTimes(1);
  });
});
