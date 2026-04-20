import { ConfigType, WorkspaceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { runPromptOrchestration } from "@/lib/prompting/orchestrator";
import {
  GeneratePromptRequest,
  ImageAspectRatio,
  PromptSummary,
  RefinePromptRequest,
  SourcePromptImage
} from "@/lib/types";
import { decryptSecret } from "@/lib/security/crypto";

type PromptExecutionOptions = {
  signal?: AbortSignal;
};

function parseJsonArray(value: string) {
  return JSON.parse(value) as string[];
}

function parsePromptSummary(value: string | null) {
  return value ? (JSON.parse(value) as PromptSummary) : null;
}

function parseSourcePromptImages(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as SourcePromptImage[];
  } catch {
    return [];
  }
}

async function loadPromptContext(workspaceId: string, selectedConfigId: string) {
  const [workspace, config] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.providerConfig.findUniqueOrThrow({ where: { id: selectedConfigId } })
  ]);

  if (config.type !== ConfigType.TEXT) {
    throw new Error("Prompt requests require a text config");
  }

  return { workspace, config };
}

export async function runGeneratePrompt(input: GeneratePromptRequest, options: PromptExecutionOptions = {}) {
  const { workspace, config } = await loadPromptContext(input.workspaceId, input.selectedConfigId);

  const result = await runPromptOrchestration({
    action: workspace.mode === "INTERVIEW" ? "interview" : "optimize",
    workspace: {
      mode: workspace.mode === "INTERVIEW" ? "interview" : "optimize",
      outputLanguage: workspace.outputLanguage === "ZH" ? "zh" : "en",
      selectedTargetType: workspace.selectedTargetType,
      selectedImageAspectRatio: workspace.selectedImageAspectRatio as ImageAspectRatio,
      sourcePrompt: input.sourcePrompt,
      sourcePromptImages: input.sourcePromptImages,
      questionMessages: parseJsonArray(workspace.questionMessages),
      answers: parseJsonArray(workspace.answers),
      finalPrompt: workspace.finalPrompt,
      parameterSummary: parsePromptSummary(workspace.parameterSummary),
      refineInstruction: workspace.refineInstruction
    },
    provider: {
      endpoint: "/v1/chat/completions",
      baseURL: config.baseUrl,
      apiKey: decryptSecret(config.apiKey),
      model: input.selectedTextModel,
      ...(options.signal ? { signal: options.signal } : {})
    }
  });

  if (result.status === "needs_clarification") {
    if (workspace.mode !== "INTERVIEW") {
      throw new Error("Optimize orchestration must return a completed result");
    }

    const question = result.question?.trim();
    if (!question) {
      throw new Error("Interview clarification must include a non-empty question");
    }

    await db.workspace.update({
      where: { id: workspace.id },
      data: {
        selectedTextConfig: config.id,
        selectedTextModel: input.selectedTextModel,
        sourcePrompt: input.sourcePrompt,
        sourcePromptImages: JSON.stringify(input.sourcePromptImages),
        questionMessages: JSON.stringify([...parseJsonArray(workspace.questionMessages), question]),
        generatedImageResult: null,
        status: WorkspaceStatus.ASKING
      }
    });

    return {
      ...result,
      question
    };
  }

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      selectedTextConfig: config.id,
      selectedTextModel: input.selectedTextModel,
      sourcePrompt: input.sourcePrompt,
      sourcePromptImages: JSON.stringify(input.sourcePromptImages),
      finalPrompt: result.finalPrompt ?? null,
      parameterSummary: result.summary ? JSON.stringify(result.summary) : null,
      generatedImageResult: null,
      status: WorkspaceStatus.IDLE
    }
  });

  return result;
}

export async function runRefinePrompt(input: RefinePromptRequest, options: PromptExecutionOptions = {}) {
  const { workspace, config } = await loadPromptContext(input.workspaceId, input.selectedConfigId);

  const result = await runPromptOrchestration({
    action: "refine",
    workspace: {
      mode: workspace.mode === "INTERVIEW" ? "interview" : "optimize",
      outputLanguage: workspace.outputLanguage === "ZH" ? "zh" : "en",
      selectedTargetType: workspace.selectedTargetType,
      selectedImageAspectRatio: workspace.selectedImageAspectRatio as ImageAspectRatio,
      sourcePrompt: workspace.sourcePrompt,
      sourcePromptImages: parseSourcePromptImages(workspace.sourcePromptImages),
      questionMessages: parseJsonArray(workspace.questionMessages),
      answers: parseJsonArray(workspace.answers),
      finalPrompt: workspace.finalPrompt,
      parameterSummary: parsePromptSummary(workspace.parameterSummary),
      refineInstruction: input.refineInstruction
    },
    provider: {
      endpoint: "/v1/chat/completions",
      baseURL: config.baseUrl,
      apiKey: decryptSecret(config.apiKey),
      model: input.selectedTextModel,
      ...(options.signal ? { signal: options.signal } : {})
    }
  });

  if (result.status !== "completed") {
    throw new Error("Refine orchestration must return a completed result");
  }

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      selectedTextConfig: config.id,
      selectedTextModel: input.selectedTextModel,
      refineInstruction: input.refineInstruction,
      finalPrompt: result.finalPrompt ?? null,
      parameterSummary: result.summary ? JSON.stringify(result.summary) : null,
      generatedImageResult: null,
      status: WorkspaceStatus.IDLE
    }
  });

  return result;
}
