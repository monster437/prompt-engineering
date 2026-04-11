import { z } from "zod";

export const modelSchema = z.object({
  modelName: z.string().min(1),
  label: z.string().min(1)
});

export const configSchema = z.object({
  type: z.enum(["text", "image"]),
  providerName: z.string().min(1),
  baseURL: z.string().url(),
  apiKey: z.string().min(1),
  models: z.array(modelSchema).min(1)
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
