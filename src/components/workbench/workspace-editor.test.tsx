import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ModelOptionDto, WorkspaceDto } from "@/lib/types";
import { serializeSelectedStyleTags, updateSelectedTargetCameraOrientation } from "@/lib/style-tags";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFileReader() {
  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

    readAsDataURL(file: Blob) {
      this.result = `data:${file.type};base64,AAAA`;
      this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  }

  vi.stubGlobal("FileReader", MockFileReader);
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
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("模式");
    expect(output).toContain("输出语言");
    expect(output).toContain("题材标签");
    expect(output).toContain("镜头朝向");
    expect(output).toContain("16:9（1792x1024）");
    expect(output).toContain("16:9（1280x720）");
    expect(output).toContain("9:16（1024x1792）");
    expect(output).toContain("9:16（720x1280）");
    expect(output).toContain("2:3");
    expect(output).toContain("3:2");
    expect(output).toContain("4:3");
    expect(output).toContain("3:4");
    expect(output).toContain("1:1（1024x1024）");
    expect(output).toContain("原始提示词");
    expect(output).toContain("上传参考图");
    expect(output).toContain("Ctrl+V");
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
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("Anthropic / claude-sonnet-4-6");
    expect(output).toContain("Replicate / sdxl");
    expect(output).toContain("文本模型");
    expect(output).toContain("图像模型");
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
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("保存中...");
    expect(output).toContain("生成中...");
    expect(output).toContain("停止生成");
    expect(output).toContain("优化中...");
  });

  it("shows config management hint when no models are available", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const notice = html.props.children[1];

    expect(notice.props.children[0]).toBe("暂无可用模型配置，请先前往");
    expect(notice.props.children[1].props.href).toBe("/configs");
    expect(notice.props.children[1].props.target).toBe("_blank");
  });

  it("exposes change and action handlers", () => {
    const onPatchWorkspace = vi.fn();
    const onGeneratePrompt = vi.fn();
    const onStopGeneratePrompt = vi.fn();
    const onRefinePrompt = vi.fn();
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace,
      onGeneratePrompt,
      onStopGeneratePrompt,
      onRefinePrompt
    });

    const sections = html.props.children[2].props.children;
    const modeSelect = sections[0].props.children[1];
    const styleTagSection = sections[2];
    const cameraOrientationSelect = sections[3].props.children[1];
    const textModelSelect = sections[4].props.children[1];
    const imageModelSelect = sections[5].props.children[1];
    const imageAspectRatioSelect = sections[6].props.children[1];
    const actionRow = sections[8];
    const actionButtons = React.Children.toArray(actionRow.props.children) as React.ReactElement<any>[];
    const generateButton = actionButtons[0];
    const refineButton = actionButtons[actionButtons.length - 1];
    const styleTagGroups = styleTagSection.props.children[1].props.children.props.children[1].props.children as React.ReactElement<any>[];
    const styleTagButtons = styleTagGroups.flatMap(
      (group) => React.Children.toArray(group.props.children[1].props.children) as React.ReactElement<any>[]
    );
    const xianxiaButton = styleTagButtons.find((button) => button.props.children === "玄幻修仙");

    modeSelect.props.onChange({ target: { value: "optimize" } });
    xianxiaButton?.props.onClick();
    cameraOrientationSelect.props.onChange({ target: { value: "back" } });
    textModelSelect.props.onChange({ target: { value: "cfg_text_1::gpt-4.1" } });
    imageModelSelect.props.onChange({ target: { value: "cfg_image_1::flux-dev" } });
    imageAspectRatioSelect.props.onChange({ target: { value: "9:16@1024x1792" } });
    generateButton.props.onClick();
    refineButton.props.onClick();

    expect(onPatchWorkspace).toHaveBeenCalledWith({ mode: "optimize" });
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      selectedTargetType: serializeSelectedStyleTags(["xianxia"])
    });
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      selectedTargetType: updateSelectedTargetCameraOrientation(serializeSelectedStyleTags(["general"]), "back")
    });
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      selectedTextConfig: "cfg_text_1",
      selectedTextModel: "gpt-4.1"
    });
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      selectedImageConfig: "cfg_image_1",
      selectedImageModel: "flux-dev"
    });
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      selectedImageAspectRatio: "9:16@1024x1792"
    });
    expect(onGeneratePrompt).toHaveBeenCalledTimes(1);
    expect(onStopGeneratePrompt).not.toHaveBeenCalled();
    expect(onRefinePrompt).toHaveBeenCalledTimes(1);
  });

  it("deduplicates duplicate model options before rendering", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [
        makeTextModel({ configId: "cfg_text_1", modelName: "gpt-5.2", label: "GPT-5.2 (Primary)" }),
        makeTextModel({ configId: "cfg_text_1", modelName: "gpt-5.2", label: "GPT-5.2 (Duplicate)" }),
        makeImageModel({ configId: "cfg_image_1", modelName: "flux-dev", label: "FLUX Dev" }),
        makeImageModel({ configId: "cfg_image_1", modelName: "flux-dev", label: "FLUX Dev Duplicate" })
      ],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const sections = html.props.children[2].props.children;
    const textModelSelect = sections[4].props.children[1];
    const imageModelSelect = sections[5].props.children[1];

    expect(textModelSelect.props.children).toHaveLength(2);
    expect(imageModelSelect.props.children).toHaveLength(2);
  });

  it("shows an auto camera tendency hint when auto orientation is selected", () => {
    const html = WorkspaceEditor({
      workspace: makeWorkspace({ selectedTargetType: '{"styleTags":["xianxia","scene-narrative"],"cameraOrientation":"auto"}' }),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("当前 auto 倾向：环境远景 / 低机位 / 俯瞰");
    expect(output).toContain("环境远景");
    expect(output).toContain("低机位");
  });

  it("shows and wires a stop button while prompt generation is running", () => {
    const onStopGeneratePrompt = vi.fn();
    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: true,
      isRefining: false,
      onPatchWorkspace: vi.fn(),
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt,
      onRefinePrompt: vi.fn()
    });

    const sections = html.props.children[2].props.children;
    const actionRow = sections[8];
    const stopButton = actionRow.props.children[1];

    expect(JSON.stringify(html)).toContain("停止生成");

    stopButton.props.onClick();
    expect(onStopGeneratePrompt).toHaveBeenCalledTimes(1);
  });

  it("uploads reference images from the source prompt area", async () => {
    const onPatchWorkspace = vi.fn();
    mockFileReader();

    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace,
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const sections = html.props.children[2].props.children;
    const sourcePromptSection = sections[7];
    const header = sourcePromptSection.props.children[0];
    const uploadTrigger = header.props.children[1];
    const uploadInput = uploadTrigger.props.children[1];
    const file = new File(["image"], "reference.png", { type: "image/png" });
    const currentTarget = { files: [file], value: "initial" };

    await uploadInput.props.onChange({ currentTarget });

    expect(currentTarget.value).toBe("");
    expect(onPatchWorkspace).toHaveBeenCalledTimes(1);
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      sourcePromptImages: [
        expect.objectContaining({
          name: "reference.png",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AAAA",
          sizeBytes: file.size
        })
      ]
    });
  });

  it("supports dragging images into the source prompt area", async () => {
    const onPatchWorkspace = vi.fn();
    mockFileReader();

    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace,
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const sections = html.props.children[2].props.children;
    const sourcePromptSection = sections[7];
    const dropZone = sourcePromptSection.props.children[1];
    const file = new File(["image"], "dragged.png", { type: "image/png" });
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    await dropZone.props.onDrop({
      preventDefault,
      stopPropagation,
      dataTransfer: { files: [file] }
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      sourcePromptImages: [
        expect.objectContaining({
          name: "dragged.png",
          mimeType: "image/png"
        })
      ]
    });
  });

  it("supports pasting screenshots into the source prompt textarea", async () => {
    const onPatchWorkspace = vi.fn();
    mockFileReader();

    const html = WorkspaceEditor({
      workspace: makeWorkspace(),
      modelOptions: [makeTextModel(), makeImageModel()],
      isSaving: false,
      isGenerating: false,
      isRefining: false,
      onPatchWorkspace,
      onGeneratePrompt: vi.fn(),
      onStopGeneratePrompt: vi.fn(),
      onRefinePrompt: vi.fn()
    });

    const sections = html.props.children[2].props.children;
    const sourcePromptSection = sections[7];
    const dropZone = sourcePromptSection.props.children[1];
    const textarea = dropZone.props.children[0];
    const file = new File(["image"], "clipboard.png", { type: "image/png" });
    const preventDefault = vi.fn();

    await textarea.props.onPaste({
      preventDefault,
      clipboardData: {
        items: [
          {
            kind: "file",
            type: "image/png",
            getAsFile: () => file
          }
        ]
      }
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onPatchWorkspace).toHaveBeenCalledWith({
      sourcePromptImages: [
        expect.objectContaining({
          name: "clipboard.png",
          mimeType: "image/png"
        })
      ]
    });
  });
});
