import { z } from "zod";

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

export const generatePromptSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedTextModel: z.string().min(1),
  sourcePrompt: z.string().min(1)
});

export const refinePromptSchema = z.object({
  workspaceId: z.string().min(1),
  selectedConfigId: z.string().min(1),
  selectedTextModel: z.string().min(1),
  refineInstruction: z.string().min(1)
});
