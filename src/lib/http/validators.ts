import { z } from "zod";

import {
  IMAGE_ASPECT_RATIOS,
  MAX_SOURCE_PROMPT_IMAGES,
  MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES
} from "@/lib/types";

export const modelSchema = z.object({
  modelName: z.string().min(1),
  label: z.string().min(1),
  providerId: z.string().min(1).optional()
});

export const configSchema = z.object({
  type: z.enum(["text", "image"]),
  providerName: z.string().min(1),
  baseURL: z.string().url(),
  apiKey: z.string().min(1),
  models: z.array(modelSchema).min(1)
});

export const updateConfigSchema = z.object({
  type: z.enum(["text", "image"]).optional(),
  providerName: z.string().min(1).optional(),
  baseURL: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  models: z.array(modelSchema).min(1).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const sourcePromptImageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().startsWith("image/"),
  dataUrl: z.string().startsWith("data:image/"),
  sizeBytes: z.number().int().positive().max(MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES)
});

export const generatePromptSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedTextModel: z.string().min(1),
  sourcePrompt: z.string(),
  sourcePromptImages: z.array(sourcePromptImageSchema).max(MAX_SOURCE_PROMPT_IMAGES).default([])
}).refine((value) => value.sourcePrompt.trim().length > 0 || value.sourcePromptImages.length > 0, {
  message: "Source prompt text or images are required"
});

export const refinePromptSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedTextModel: z.string().min(1),
  refineInstruction: z.string().min(1)
});

export const reversePromptSchema = z.object({
  selectedConfigId: z.string().min(1),
  selectedTextModel: z.string().min(1),
  outputLanguage: z.enum(["zh", "en"]),
  sourcePromptImages: z.array(sourcePromptImageSchema).min(1).max(MAX_SOURCE_PROMPT_IMAGES),
  userInstruction: z.string().default("")
});

export const generateImageSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedImageModel: z.string().min(1),
  selectedImageAspectRatio: z.enum(IMAGE_ASPECT_RATIOS),
  prompt: z.string().min(1)
});

export const diagnoseImageProviderSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedImageModel: z.string().min(1)
});
