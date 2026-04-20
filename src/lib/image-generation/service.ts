import { ConfigType } from "@prisma/client";

import { db } from "@/lib/db";
import type { DiagnoseImageProviderRequest, GenerateImageRequest } from "@/lib/types";
import { decryptSecret } from "@/lib/security/crypto";
import {
  callOpenAiCompatibleImageProvider,
  diagnoseOpenAiCompatibleImageProvider
} from "@/lib/providers/openai-compatible";

type ImageExecutionOptions = {
  signal?: AbortSignal;
};

async function loadImageContext(workspaceId: string, selectedConfigId: string) {
  const [workspace, config] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.providerConfig.findUniqueOrThrow({ where: { id: selectedConfigId } })
  ]);

  if (config.type !== ConfigType.IMAGE) {
    throw new Error("Image requests require an image config");
  }

  return { workspace, config };
}

export async function runGenerateImage(input: GenerateImageRequest, options: ImageExecutionOptions = {}) {
  const { workspace, config } = await loadImageContext(input.workspaceId, input.selectedConfigId);
  const finalPrompt = workspace.finalPrompt?.trim();

  if (!finalPrompt) {
    throw new Error("Image generation requires a workspace final prompt");
  }

  const providerResult = await callOpenAiCompatibleImageProvider({
    endpoint: "/v1/images/generations",
    baseURL: config.baseUrl,
    apiKey: decryptSecret(config.apiKey),
    model: input.selectedImageModel,
    aspectRatio: input.selectedImageAspectRatio,
    prompt: finalPrompt,
    ...(options.signal ? { signal: options.signal } : {})
  });
  const result = {
    ...providerResult,
    usedPrompt: finalPrompt,
    promptSource: "workspace_final_prompt" as const,
    promptEnhancementError: null,
    selectedImageConfig: input.selectedConfigId,
    selectedImageModel: input.selectedImageModel,
    selectedImageAspectRatio: input.selectedImageAspectRatio
  };

  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      selectedImageConfig: input.selectedConfigId,
      selectedImageAspectRatio: input.selectedImageAspectRatio,
      selectedImageModel: input.selectedImageModel,
      generatedImageResult: JSON.stringify(result)
    }
  });

  return result;
}

export async function runDiagnoseImageProvider(input: DiagnoseImageProviderRequest, options: ImageExecutionOptions = {}) {
  const { config } = await loadImageContext(input.workspaceId, input.selectedConfigId);
  const result = await diagnoseOpenAiCompatibleImageProvider({
    baseURL: config.baseUrl,
    apiKey: decryptSecret(config.apiKey),
    model: input.selectedImageModel,
    ...(options.signal ? { signal: options.signal } : {})
  });

  return {
    workspaceId: input.workspaceId,
    selectedConfigId: input.selectedConfigId,
    providerName: config.providerName,
    baseURL: config.baseUrl,
    selectedImageModel: input.selectedImageModel,
    ...result
  };
}
