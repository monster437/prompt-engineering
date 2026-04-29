import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { GenerateImageResult, PromptSummary, WorkspaceDto } from "@/lib/types";

import {
  IMAGE_PREVIEW_MAX_SCALE,
  IMAGE_PREVIEW_MIN_SCALE,
  ImagePreviewModal,
  PromptResultPanel,
  buildImageDownloadFilenameBase,
  getNextImagePreviewPanOffset,
  getNextImagePreviewScale
} from "./prompt-result-panel";

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

function makeImageResult(overrides: Partial<GenerateImageResult> = {}): GenerateImageResult {
  return {
    images: [{ url: "https://example.com/generated.png" }],
    revisedPrompt: "A cinematic rainy neon street",
    usedPrompt: "A premium cinematic fantasy scene with sharp eyes and layered environment",
    promptSource: "enhanced",
    promptEnhancementError: null,
    selectedImageConfig: "cfg_image_1",
    selectedImageModel: "gpt-image-1",
    selectedImageAspectRatio: "9:16@1024x1792",
    ...overrides
  };
}

describe("PromptResultPanel", () => {
  it("adds a random image prefix while keeping the readable download filename suffix", () => {
    const firstFilenameBase = buildImageDownloadFilenameBase({
      workspaceTitle: "Workspace 6",
      imageModel: "gpt-image-2",
      imageAspectRatio: "auto",
      imageIndex: 0,
      randomToken: "a3f91c8b"
    });
    const secondFilenameBase = buildImageDownloadFilenameBase({
      workspaceTitle: "Workspace 6",
      imageModel: "gpt-image-2",
      imageAspectRatio: "auto",
      imageIndex: 0,
      randomToken: "f04d22aa"
    });

    expect(firstFilenameBase).toBe("img-a3f91c8b-Workspace_6-gpt-image-2-auto-1");
    expect(secondFilenameBase).toBe("img-f04d22aa-Workspace_6-gpt-image-2-auto-1");
    expect(firstFilenameBase).not.toBe(secondFilenameBase);
  });

  it("renders an in-app image preview modal with close affordances", () => {
    const onClose = vi.fn();
    const onWheel = vi.fn();
    const html = ImagePreviewModal({
      imageUrl: "https://example.com/generated.png",
      imageAlt: "Generated result 1",
      scale: 1.4,
      panX: 0,
      panY: 0,
      onClose,
      onWheel,
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn()
    });

    const output = JSON.stringify(html);
    const modalCard = html.props.children;
    const header = modalCard.props.children[0];
    const closeButton = header.props.children[1];

    expect(output).toContain("https://example.com/generated.png");
    expect(output).toContain("关闭图片预览");
    expect(output).toContain("滚轮缩放");
    expect(html.props.role).toBe("presentation");
    expect(modalCard.props.role).toBe("dialog");

    closeButton.props.onClick();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clamps image preview wheel zoom within the supported range", () => {
    expect(getNextImagePreviewScale(1, -120)).toBe(1.2);
    expect(getNextImagePreviewScale(1, 120)).toBe(0.8);
    expect(getNextImagePreviewScale(IMAGE_PREVIEW_MAX_SCALE, -120)).toBe(IMAGE_PREVIEW_MAX_SCALE);
    expect(getNextImagePreviewScale(IMAGE_PREVIEW_MIN_SCALE, 120)).toBe(IMAGE_PREVIEW_MIN_SCALE);
  });

  it("supports dragging the preview image by transform instead of scroll position", () => {
    const html = ImagePreviewModal({
      imageUrl: "https://example.com/generated.png",
      imageAlt: "Generated result 1",
      scale: 1.4,
      panX: 40,
      panY: -20,
      onClose: vi.fn(),
      onWheel: vi.fn(),
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn()
    });

    const modalCard = html.props.children;
    const viewport = modalCard.props.children[1];
    const imageElement = viewport.props.children;

    expect(viewport.props.className).toContain("overflow-hidden");
    expect(viewport.props.className).not.toContain("overflow-auto");
    expect(typeof viewport.props.onPointerDown).toBe("function");
    expect(typeof viewport.props.onPointerMove).toBe("function");
    expect(typeof viewport.props.onPointerUp).toBe("function");
    expect(imageElement.props.draggable).toBe(false);
    expect(imageElement.props.style.transform).toBe("translate3d(40px, -20px, 0) scale(1.4)");

    expect(
      getNextImagePreviewPanOffset(
        {
          startClientX: 200,
          startClientY: 300,
          originPanX: 40,
          originPanY: -20
        },
        160,
        240
      )
    ).toEqual({
      panX: 0,
      panY: -80
    });
  });

  it("renders final prompt and structured summary", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({
        finalPrompt: "A cinematic rainy neon street with glowing reflections",
        parameterSummary: makeSummary()
      }),
      refineDraft: "",
      imageResult: null,
      isCopying: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      canGenerateImage: true,
      canDiagnoseImage: false,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn()
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
      imageResult: null,
      isCopying: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      canGenerateImage: false,
      canDiagnoseImage: false,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn()
    });

    expect(JSON.stringify(html)).toContain("还没有生成结果。");
  });

  it("shows copy pending state", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({ finalPrompt: "Prompt" }),
      refineDraft: "Make it moodier",
      imageResult: null,
      isCopying: true,
      isGeneratingImage: true,
      isDiagnosingImage: true,
      canGenerateImage: true,
      canDiagnoseImage: true,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("复制中...");
    expect(output).toContain("出图中...");
    expect(output).toContain("停止生成");
    expect(output).toContain("测试中...");
    expect(output).toContain("Make it moodier");
  });

  it("renders generated images and revised prompt", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({
        finalPrompt: "Prompt",
        selectedImageConfig: "cfg_image_1",
        selectedImageAspectRatio: "9:16@1024x1792",
        selectedImageModel: "gpt-image-1"
      }),
      refineDraft: "",
      imageResult: makeImageResult(),
      isCopying: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      canGenerateImage: true,
      canDiagnoseImage: true,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("图片结果");
    expect(output).toContain("https://example.com/generated.png");
    expect(output).toContain("本次实际生图提示词");
    expect(output).toContain("来源：增强后提示词");
    expect(output).toContain("Provider revised prompt");
    expect(output).toContain("打开原图");
    expect(output).toContain("下载图片");
    expect(output).toContain("结果来源模型：gpt-image-1");
    expect(output).toContain("比例：9:16");
    expect(output).not.toContain("比例：9:16@1024x1792");
  });

  it("keeps showing the original image result metadata after switching to another image model", () => {
    const html = PromptResultPanel({
      workspace: makeWorkspace({
        finalPrompt: "Prompt",
        selectedImageConfig: "cfg_image_2",
        selectedImageAspectRatio: "1:1@1024x1024",
        selectedImageModel: "flux-dev"
      }),
      refineDraft: "",
      imageResult: makeImageResult({
        selectedImageConfig: "cfg_image_1",
        selectedImageAspectRatio: "9:16@1024x1792",
        selectedImageModel: "gpt-image-1"
      }),
      isCopying: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      canGenerateImage: true,
      canDiagnoseImage: true,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage: vi.fn(),
      onDiagnoseImage: vi.fn()
    });

    const output = JSON.stringify(html);

    expect(output).toContain("结果来源模型：gpt-image-1");
    expect(output).toContain("比例：9:16");
    expect(output).not.toContain("结果来源模型：flux-dev");
    expect(output).not.toContain("比例：1:1");
    expect(output).not.toContain("比例：1:1@1024x1024");
  });

  it("wires refine draft, image generation, and copy handlers", () => {
    const onRefineDraftChange = vi.fn();
    const onCopyPrompt = vi.fn();
    const onGenerateImage = vi.fn();
    const onStopGenerateImage = vi.fn();
    const onDiagnoseImage = vi.fn();
    const html = PromptResultPanel({
      workspace: makeWorkspace({ finalPrompt: "Prompt" }),
      refineDraft: "",
      imageResult: null,
      isCopying: false,
      isGeneratingImage: false,
      isDiagnosingImage: false,
      canGenerateImage: true,
      canDiagnoseImage: true,
      onRefineDraftChange,
      onCopyPrompt,
      onGenerateImage,
      onStopGenerateImage,
      onDiagnoseImage
    });

    const header = html.props.children[0];
    const actionButtons = React.Children.toArray(header.props.children[1].props.children) as React.ReactElement<any>[];
    const diagnoseImageButton = actionButtons[0];
    const generateImageButton = actionButtons[1];
    const copyButton = actionButtons[actionButtons.length - 1];
    const body = html.props.children[1];
    const sections = React.Children.toArray(body.props.children) as React.ReactElement<any>[];
    const refineSection = sections[sections.length - 1] as React.ReactElement<any>;
    const refineField = refineSection.props.children[1] as React.ReactElement<any>;

    refineField.props.onChange({ target: { value: "Make it moodier" } });
    diagnoseImageButton.props.onClick();
    generateImageButton.props.onClick();
    copyButton.props.onClick();

    expect(onRefineDraftChange).toHaveBeenCalledWith("Make it moodier");
    expect(onDiagnoseImage).toHaveBeenCalledTimes(1);
    expect(onGenerateImage).toHaveBeenCalledTimes(1);
    expect(onStopGenerateImage).not.toHaveBeenCalled();
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
  });

  it("wires the stop image generation button while a generation request is running", () => {
    const onStopGenerateImage = vi.fn();
    const html = PromptResultPanel({
      workspace: makeWorkspace({ finalPrompt: "Prompt" }),
      refineDraft: "",
      imageResult: null,
      isCopying: false,
      isGeneratingImage: true,
      isDiagnosingImage: false,
      canGenerateImage: true,
      canDiagnoseImage: true,
      onRefineDraftChange: vi.fn(),
      onCopyPrompt: vi.fn(),
      onGenerateImage: vi.fn(),
      onStopGenerateImage,
      onDiagnoseImage: vi.fn()
    });

    const header = html.props.children[0];
    const actionButtons = header.props.children[1];
    const stopButton = actionButtons.props.children[2];

    stopButton.props.onClick();
    expect(onStopGenerateImage).toHaveBeenCalledTimes(1);
  });
});
