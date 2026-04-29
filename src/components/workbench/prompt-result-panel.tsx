"use client";

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { GenerateImageResult, WorkspaceDto } from "@/lib/types";
import { getDisplayAspectRatio } from "@/lib/image-generation/catalog";

type PromptResultPanelProps = {
  workspace: WorkspaceDto;
  refineDraft: string;
  imageResult: GenerateImageResult | null;
  isCopying: boolean;
  isGeneratingImage: boolean;
  isDiagnosingImage: boolean;
  canGenerateImage: boolean;
  canDiagnoseImage: boolean;
  onRefineDraftChange: (value: string) => void;
  onCopyPrompt: () => void;
  onGenerateImage: () => void;
  onStopGenerateImage: () => void;
  onDiagnoseImage: () => void;
};

const summaryFields: Array<{ key: keyof NonNullable<WorkspaceDto["parameterSummary"]>; label: string }> = [
  { key: "style", label: "风格" },
  { key: "scene", label: "场景" },
  { key: "time", label: "时间" },
  { key: "mood", label: "氛围" },
  { key: "quality", label: "质量" },
  { key: "composition", label: "构图" }
];

const IMAGE_DOWNLOAD_RANDOM_TOKEN_BYTES = 4;

function sanitizeImageDownloadFilenamePart(value: string) {
  return value.replace(/[^\w\u4e00-\u9fa5-]+/g, "_");
}

export function createImageDownloadRandomToken() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(IMAGE_DOWNLOAD_RANDOM_TOKEN_BYTES);
    crypto.getRandomValues(randomBytes);

    return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return Math.random().toString(16).slice(2, 10).padEnd(8, "0");
}

type BuildImageDownloadFilenameBaseInput = {
  workspaceTitle: string;
  imageModel: string;
  imageAspectRatio: string;
  imageIndex: number;
  randomToken?: string;
};

export function buildImageDownloadFilenameBase({
  workspaceTitle,
  imageModel,
  imageAspectRatio,
  imageIndex,
  randomToken = createImageDownloadRandomToken()
}: BuildImageDownloadFilenameBaseInput) {
  const safeTitle = workspaceTitle.trim() ? workspaceTitle.trim() : "workspace";
  const displayAspectRatio = getDisplayAspectRatio(imageAspectRatio);
  const readableFilenameBase = sanitizeImageDownloadFilenamePart(
    [safeTitle, imageModel, displayAspectRatio, `${imageIndex + 1}`].join("-")
  );
  const safeRandomToken = sanitizeImageDownloadFilenamePart(randomToken) || createImageDownloadRandomToken();

  return `img-${safeRandomToken}-${readableFilenameBase}`;
}

export const IMAGE_PREVIEW_MIN_SCALE = 0.4;
export const IMAGE_PREVIEW_MAX_SCALE = 4;
const IMAGE_PREVIEW_DEFAULT_SCALE = 1;
const IMAGE_PREVIEW_STEP = 0.2;

let activeImagePreviewRoot: Root | null = null;
let activeImagePreviewContainer: HTMLDivElement | null = null;
let removeImagePreviewKeydownListener: (() => void) | null = null;
let restoreBodyOverflow: string | null = null;

function roundImagePreviewScale(scale: number) {
  return Math.round(scale * 100) / 100;
}

export function clampImagePreviewScale(scale: number) {
  if (!Number.isFinite(scale)) {
    return IMAGE_PREVIEW_DEFAULT_SCALE;
  }

  return roundImagePreviewScale(Math.min(IMAGE_PREVIEW_MAX_SCALE, Math.max(IMAGE_PREVIEW_MIN_SCALE, scale)));
}

export function getNextImagePreviewScale(currentScale: number, deltaY: number) {
  if (deltaY === 0) {
    return clampImagePreviewScale(currentScale);
  }

  return clampImagePreviewScale(currentScale + (deltaY < 0 ? IMAGE_PREVIEW_STEP : -IMAGE_PREVIEW_STEP));
}

type ImagePreviewModalProps = {
  imageUrl: string;
  imageAlt: string;
  scale: number;
  panX: number;
  panY: number;
  onClose: () => void;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
};

type ImagePreviewPanState = {
  startClientX: number;
  startClientY: number;
  originPanX: number;
  originPanY: number;
};

export function getNextImagePreviewPanOffset(
  panState: ImagePreviewPanState,
  clientX: number,
  clientY: number
) {
  return {
    panX: panState.originPanX + clientX - panState.startClientX,
    panY: panState.originPanY + clientY - panState.startClientY
  };
}

export function ImagePreviewModal({
  imageUrl,
  imageAlt,
  scale,
  panX,
  panY,
  onClose,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}: ImagePreviewModalProps) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal={true}
        aria-label="图片预览"
        className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 text-slate-100">
          <div className="min-w-0">
            <p className="text-sm font-medium">图片预览</p>
            <p className="text-xs text-slate-400">
              点击空白处关闭 · 滚轮缩放 · 当前 {Math.round(scale * 100)}%
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭图片预览"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-xl leading-none text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            ×
          </button>
        </div>
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{ cursor: "grab", touchAction: "none" }}
        >
          <img
            src={imageUrl}
            alt={imageAlt}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out"
            style={{
              transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
              transformOrigin: "center center",
              userSelect: "none"
            }}
          />
        </div>
      </div>
    </div>
  );
}

function closeActiveImagePreview() {
  activeImagePreviewRoot?.unmount();
  activeImagePreviewRoot = null;

  if (activeImagePreviewContainer) {
    activeImagePreviewContainer.remove();
    activeImagePreviewContainer = null;
  }

  removeImagePreviewKeydownListener?.();
  removeImagePreviewKeydownListener = null;

  if (restoreBodyOverflow !== null && typeof document !== "undefined") {
    document.body.style.overflow = restoreBodyOverflow;
  }

  restoreBodyOverflow = null;
}

function openImagePreview(url: string, alt: string) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  closeActiveImagePreview();

  const container = document.createElement("div");
  document.body.appendChild(container);

  activeImagePreviewContainer = container;
  activeImagePreviewRoot = createRoot(container);

  restoreBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeActiveImagePreview();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  removeImagePreviewKeydownListener = () => {
    window.removeEventListener("keydown", handleKeyDown);
  };

  let currentScale = IMAGE_PREVIEW_DEFAULT_SCALE;
  let currentPanX = 0;
  let currentPanY = 0;
  let panState: ImagePreviewPanState | null = null;

  const stopDraggingPreview = (element?: HTMLDivElement | null, pointerId?: number) => {
    if (element && pointerId !== undefined && element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }

    if (element) {
      element.style.cursor = "grab";
    }

    panState = null;
  };

  const renderPreview = () => {
    activeImagePreviewRoot?.render(
      <ImagePreviewModal
        imageUrl={url}
        imageAlt={alt}
        scale={currentScale}
        panX={currentPanX}
        panY={currentPanY}
        onClose={closeActiveImagePreview}
        onWheel={(event) => {
          event.preventDefault();
          currentScale = getNextImagePreviewScale(currentScale, event.deltaY);
          renderPreview();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }

          panState = {
            startClientX: event.clientX,
            startClientY: event.clientY,
            originPanX: currentPanX,
            originPanY: currentPanY
          };

          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.style.cursor = "grabbing";
        }}
        onPointerMove={(event) => {
          if (!panState) {
            return;
          }

          event.preventDefault();
          const nextOffset = getNextImagePreviewPanOffset(panState, event.clientX, event.clientY);
          currentPanX = nextOffset.panX;
          currentPanY = nextOffset.panY;
          renderPreview();
        }}
        onPointerUp={(event) => {
          stopDraggingPreview(event.currentTarget, event.pointerId);
        }}
        onPointerCancel={(event) => {
          stopDraggingPreview(event.currentTarget, event.pointerId);
        }}
      />
    );
  };

  renderPreview();
}

export function PromptResultPanel({
  workspace,
  refineDraft,
  imageResult,
  isCopying,
  isGeneratingImage,
  isDiagnosingImage,
  canGenerateImage,
  canDiagnoseImage,
  onRefineDraftChange,
  onCopyPrompt,
  onGenerateImage,
  onStopGenerateImage,
  onDiagnoseImage
}: PromptResultPanelProps) {
  async function downloadImage(url: string, index: number, alt: string) {
    if (typeof document === "undefined") {
      return;
    }

    const resultImageModel = imageResult?.selectedImageModel ?? workspace.selectedImageModel ?? "image";
    const resultImageAspectRatio =
      imageResult?.selectedImageAspectRatio ?? workspace.selectedImageAspectRatio;
    const filenameBase = buildImageDownloadFilenameBase({
      workspaceTitle: workspace.title,
      imageModel: resultImageModel,
      imageAspectRatio: resultImageAspectRatio,
      imageIndex: index
    });

    const anchor = document.createElement("a");

    if (url.startsWith("data:")) {
      anchor.href = url;
      anchor.download = `${filenameBase}.png`;
      anchor.click();
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Image download failed with ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const extension =
        blob.type === "image/jpeg"
          ? "jpg"
          : blob.type === "image/webp"
            ? "webp"
            : "png";

      anchor.href = objectUrl;
      anchor.download = `${filenameBase}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      openImagePreview(url, alt);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">结果区</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDiagnoseImage}
            disabled={!canDiagnoseImage || isDiagnosingImage}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isDiagnosingImage ? "测试中..." : "测试图片通道"}
          </button>
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={!canGenerateImage || isGeneratingImage}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isGeneratingImage ? "出图中..." : "生成图片"}
          </button>
          {isGeneratingImage ? (
            <button
              type="button"
              onClick={onStopGenerateImage}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
            >
              停止生成
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCopyPrompt}
            disabled={!workspace.finalPrompt || isCopying}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isCopying ? "复制中..." : "复制提示词"}
          </button>
        </div>
      </div>

      {workspace.finalPrompt ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-900">最终提示词</h3>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-slate-100">
              {workspace.finalPrompt}
            </pre>
          </div>

          {workspace.parameterSummary ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900">参数摘要</h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {summaryFields.map((field) => (
                  <div key={field.key} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <dt className="font-medium text-slate-900">{field.label}</dt>
                    <dd className="mt-1 text-slate-600">{workspace.parameterSummary?.[field.key]}</dd>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 p-3 text-sm sm:col-span-2">
                  <dt className="font-medium text-slate-900">补充信息</dt>
                  <dd className="mt-1 text-slate-600">
                    {workspace.parameterSummary.extras.length > 0
                      ? workspace.parameterSummary.extras.join(", ")
                      : "无"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-slate-900">图片结果</h3>
              <span className="text-xs text-slate-500">
                {(imageResult?.selectedImageModel ?? workspace.selectedImageModel)
                  ? `结果来源模型：${imageResult?.selectedImageModel ?? workspace.selectedImageModel} · 比例：${getDisplayAspectRatio(imageResult?.selectedImageAspectRatio ?? workspace.selectedImageAspectRatio)}`
                  : "未选择图像模型"}
              </span>
            </div>

            {imageResult ? (
              <div className="space-y-3">
                {imageResult.usedPrompt ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-medium text-slate-900">本次实际生图提示词</h4>
                      <span className="text-xs text-slate-500">
                        {imageResult.promptSource === "enhanced" ? "来源：增强后提示词" : "来源：最终提示词"}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-700">{imageResult.usedPrompt}</pre>
                    {imageResult.promptEnhancementError ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        提示词增强未完全生效，已自动回退。原因：{imageResult.promptEnhancementError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {imageResult.revisedPrompt ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Provider revised prompt：{imageResult.revisedPrompt}
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {imageResult.images.map((image, index) => {
                    const imageAlt = `Generated result ${index + 1}`;

                    return (
                      <div
                        key={`${index}-${image.url.slice(0, 32)}`}
                        className="space-y-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"
                      >
                        <button
                          type="button"
                          aria-label={`预览图片 ${index + 1}`}
                          onDoubleClick={() => openImagePreview(image.url, imageAlt)}
                          className="block w-full overflow-hidden rounded-lg"
                          title="双击在当前页面查看大图"
                        >
                          <img
                            src={image.url}
                            alt={imageAlt}
                            className="h-full w-full object-cover"
                          />
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openImagePreview(image.url, imageAlt)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700"
                          >
                            打开原图
                          </button>
                          <button
                            type="button"
                            onClick={() => void downloadImage(image.url, index, imageAlt)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700"
                          >
                            下载图片
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                {workspace.selectedImageModel ? "还没有图片结果。" : "请选择图像模型后生成图片。"}
              </p>
            )}
          </div>

          <label className="block space-y-1 text-sm text-slate-700">
            <span className="font-medium">优化指令</span>
            <textarea
              value={refineDraft}
              onChange={(event) => onRefineDraftChange(event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          还没有生成结果。
        </p>
      )}
    </section>
  );
}
