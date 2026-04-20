import {
  OutputLanguage,
  ReverseWorkspace,
  ReverseWorkspaceStatus as PrismaReverseWorkspaceStatus
} from "@prisma/client";

import { db } from "@/lib/db";
import type {
  PromptResult,
  ReverseWorkspaceDto,
  SourcePromptImage
} from "@/lib/types";

function isSourcePromptImage(value: unknown): value is SourcePromptImage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const image = value as Record<string, unknown>;

  return (
    typeof image.id === "string" &&
    image.id.length > 0 &&
    typeof image.name === "string" &&
    image.name.length > 0 &&
    typeof image.mimeType === "string" &&
    image.mimeType.startsWith("image/") &&
    typeof image.dataUrl === "string" &&
    image.dataUrl.startsWith("data:image/") &&
    typeof image.sizeBytes === "number" &&
    Number.isFinite(image.sizeBytes) &&
    image.sizeBytes > 0
  );
}

function parseSourcePromptImages(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every(isSourcePromptImage) ? parsed : [];
  } catch {
    return [];
  }
}

function isPromptResult(value: unknown): value is PromptResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;
  const summary = result.summary as Record<string, unknown> | null | undefined;

  return (
    (result.status === "completed" || result.status === "needs_clarification") &&
    typeof result.contextSnapshot === "object" &&
    result.contextSnapshot !== null &&
    (result.question === undefined || typeof result.question === "string") &&
    (result.finalPrompt === undefined || typeof result.finalPrompt === "string") &&
    (summary === undefined ||
      summary === null ||
      (typeof summary.style === "string" &&
        typeof summary.scene === "string" &&
        typeof summary.time === "string" &&
        typeof summary.mood === "string" &&
        typeof summary.quality === "string" &&
        typeof summary.composition === "string" &&
        Array.isArray(summary.extras) &&
        summary.extras.every((item) => typeof item === "string")))
  );
}

function parsePromptResult(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isPromptResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createEmptyReverseWorkspace(title: string) {
  return {
    title,
    outputLanguage: "zh",
    userInstruction: "",
    sourcePromptImages: [],
    status: "idle"
  } as const;
}

export function toReverseWorkspaceDto(workspace: ReverseWorkspace): ReverseWorkspaceDto {
  return {
    id: workspace.id,
    title: workspace.title,
    selectedTextConfig: workspace.selectedTextConfig,
    selectedTextModel: workspace.selectedTextModel,
    outputLanguage: workspace.outputLanguage === OutputLanguage.ZH ? "zh" : "en",
    userInstruction: workspace.userInstruction,
    sourcePromptImages: parseSourcePromptImages(workspace.sourcePromptImages),
    result: parsePromptResult(workspace.resultJson),
    errorMessage: workspace.errorMessage,
    status:
      workspace.status === PrismaReverseWorkspaceStatus.GENERATING
        ? "generating"
        : workspace.status === PrismaReverseWorkspaceStatus.COMPLETED
          ? "completed"
          : workspace.status === PrismaReverseWorkspaceStatus.ERROR
            ? "error"
            : "idle"
  };
}

export function toReverseWorkspaceUpdateData(payload: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (typeof payload.title === "string") data.title = payload.title;
  if (typeof payload.selectedTextConfig === "string" || payload.selectedTextConfig === null) {
    data.selectedTextConfig = payload.selectedTextConfig;
  }
  if (typeof payload.selectedTextModel === "string" || payload.selectedTextModel === null) {
    data.selectedTextModel = payload.selectedTextModel;
  }
  if (payload.outputLanguage === "zh") data.outputLanguage = OutputLanguage.ZH;
  if (payload.outputLanguage === "en") data.outputLanguage = OutputLanguage.EN;
  if (typeof payload.userInstruction === "string") data.userInstruction = payload.userInstruction;
  if (Array.isArray(payload.sourcePromptImages) && payload.sourcePromptImages.every(isSourcePromptImage)) {
    data.sourcePromptImages = JSON.stringify(payload.sourcePromptImages);
  }
  if (payload.result === null) data.resultJson = null;
  if (isPromptResult(payload.result)) data.resultJson = JSON.stringify(payload.result);
  if (typeof payload.errorMessage === "string" || payload.errorMessage === null) {
    data.errorMessage = payload.errorMessage;
  }
  if (payload.status === "idle") data.status = PrismaReverseWorkspaceStatus.IDLE;
  if (payload.status === "generating") data.status = PrismaReverseWorkspaceStatus.GENERATING;
  if (payload.status === "completed") data.status = PrismaReverseWorkspaceStatus.COMPLETED;
  if (payload.status === "error") data.status = PrismaReverseWorkspaceStatus.ERROR;

  return data;
}

export async function listReverseWorkspaces() {
  const workspaces = await db.reverseWorkspace.findMany({ orderBy: { createdAt: "asc" } });
  return workspaces.map(toReverseWorkspaceDto);
}

export async function createReverseWorkspace(title: string) {
  const created = await db.reverseWorkspace.create({
    data: {
      title,
      outputLanguage: OutputLanguage.ZH,
      userInstruction: "",
      sourcePromptImages: "[]",
      status: PrismaReverseWorkspaceStatus.IDLE
    }
  });

  return toReverseWorkspaceDto(created);
}
