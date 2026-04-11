export type ConfigKind = "text" | "image";
export type WorkspaceMode = "interview" | "optimize";
export type OutputLanguage = "zh" | "en";
export type WorkspaceStatus = "idle" | "asking" | "generating" | "refining" | "error";

export type ProviderModel = {
  modelName: string;
  label: string;
  providerId?: string;
};

export type ProviderConfigDto = {
  id: string;
  type: ConfigKind;
  providerName: string;
  baseURL: string;
  apiKeyMasked: string;
  models: ProviderModel[];
};

export type PromptSummary = {
  style: string;
  scene: string;
  time: string;
  mood: string;
  quality: string;
  composition: string;
  extras: string[];
};

export type PromptResult = {
  status: "needs_clarification" | "completed";
  question?: string;
  finalPrompt?: string;
  summary?: PromptSummary;
  contextSnapshot: Record<string, unknown>;
};

export type GeneratePromptRequest = {
  workspaceId: string;
  selectedConfigId: string;
  selectedTextModel: string;
  sourcePrompt: string;
};

export type RefinePromptRequest = {
  workspaceId: string;
  selectedConfigId: string;
  selectedTextModel: string;
  refineInstruction: string;
};
