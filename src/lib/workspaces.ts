import { OutputLanguage, Workspace, WorkspaceMode, WorkspaceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PromptSummary } from "@/lib/types";

export function createEmptyWorkspace(title: string) {
  return {
    title,
    mode: "optimize",
    outputLanguage: "zh",
    selectedTargetType: "general",
    sourcePrompt: "",
    questionMessages: [],
    answers: [],
    status: "idle"
  };
}

export function toWorkspaceDto(workspace: Workspace) {
  return {
    id: workspace.id,
    title: workspace.title,
    mode: workspace.mode === WorkspaceMode.OPTIMIZE ? "optimize" : "interview",
    outputLanguage: workspace.outputLanguage === OutputLanguage.ZH ? "zh" : "en",
    selectedTextModel: workspace.selectedTextModel,
    selectedTextConfig: workspace.selectedTextConfig,
    selectedTargetType: workspace.selectedTargetType,
    selectedImageModel: workspace.selectedImageModel,
    sourcePrompt: workspace.sourcePrompt,
    questionMessages: JSON.parse(workspace.questionMessages) as string[],
    answers: JSON.parse(workspace.answers) as string[],
    finalPrompt: workspace.finalPrompt,
    parameterSummary: workspace.parameterSummary
      ? (JSON.parse(workspace.parameterSummary) as PromptSummary)
      : null,
    refineInstruction: workspace.refineInstruction,
    status:
      workspace.status === WorkspaceStatus.IDLE
        ? "idle"
        : workspace.status === WorkspaceStatus.ASKING
          ? "asking"
          : workspace.status === WorkspaceStatus.GENERATING
            ? "generating"
            : workspace.status === WorkspaceStatus.REFINING
              ? "refining"
              : "error"
  };
}

function isPromptSummary(value: unknown): value is PromptSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const summary = value as Record<string, unknown>;

  return (
    typeof summary.style === "string" &&
    typeof summary.scene === "string" &&
    typeof summary.time === "string" &&
    typeof summary.mood === "string" &&
    typeof summary.quality === "string" &&
    typeof summary.composition === "string" &&
    Array.isArray(summary.extras) &&
    summary.extras.every((extra) => typeof extra === "string")
  );
}

export function toWorkspaceUpdateData(payload: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (typeof payload.title === "string") data.title = payload.title;
  if (payload.mode === "optimize") data.mode = WorkspaceMode.OPTIMIZE;
  if (payload.mode === "interview") data.mode = WorkspaceMode.INTERVIEW;
  if (payload.outputLanguage === "zh") data.outputLanguage = OutputLanguage.ZH;
  if (payload.outputLanguage === "en") data.outputLanguage = OutputLanguage.EN;
  if (typeof payload.selectedTextModel === "string" || payload.selectedTextModel === null) data.selectedTextModel = payload.selectedTextModel;
  if (typeof payload.selectedTextConfig === "string" || payload.selectedTextConfig === null) data.selectedTextConfig = payload.selectedTextConfig;
  if (typeof payload.selectedTargetType === "string") data.selectedTargetType = payload.selectedTargetType;
  if (typeof payload.selectedImageModel === "string" || payload.selectedImageModel === null) data.selectedImageModel = payload.selectedImageModel;
  if (typeof payload.sourcePrompt === "string") data.sourcePrompt = payload.sourcePrompt;
  if (Array.isArray(payload.questionMessages)) data.questionMessages = JSON.stringify(payload.questionMessages);
  if (Array.isArray(payload.answers)) data.answers = JSON.stringify(payload.answers);
  if (typeof payload.finalPrompt === "string" || payload.finalPrompt === null) data.finalPrompt = payload.finalPrompt;
  if (payload.parameterSummary === null) data.parameterSummary = null;
  if (isPromptSummary(payload.parameterSummary)) data.parameterSummary = JSON.stringify(payload.parameterSummary);
  if (typeof payload.refineInstruction === "string" || payload.refineInstruction === null) data.refineInstruction = payload.refineInstruction;
  if (payload.status === "idle") data.status = WorkspaceStatus.IDLE;
  if (payload.status === "asking") data.status = WorkspaceStatus.ASKING;
  if (payload.status === "generating") data.status = WorkspaceStatus.GENERATING;
  if (payload.status === "refining") data.status = WorkspaceStatus.REFINING;
  if (payload.status === "error") data.status = WorkspaceStatus.ERROR;

  return data;
}

export async function listWorkspaces() {
  const workspaces = await db.workspace.findMany({ orderBy: { createdAt: "asc" } });
  return workspaces.map(toWorkspaceDto);
}

export async function createWorkspace(title: string) {
  const created = await db.workspace.create({
    data: {
      title,
      mode: WorkspaceMode.OPTIMIZE,
      outputLanguage: OutputLanguage.ZH,
      selectedTargetType: "general"
    }
  });

  return toWorkspaceDto(created);
}
