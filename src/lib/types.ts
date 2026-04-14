export type ConfigKind = "text" | "image";
export type WorkspaceMode = "interview" | "optimize";
export type OutputLanguage = "zh" | "en";
export type WorkspaceStatus = "idle" | "asking" | "generating" | "refining" | "error";

export type ProviderModel = {
  modelName: string;
  label: string;
  providerId?: string;
};

export type CreateProviderConfigRequest = {
  type: ConfigKind;
  providerName: string;
  baseURL: string;
  apiKey: string;
  models: ProviderModel[];
};

export type UpdateProviderConfigRequest = Partial<{
  type: ConfigKind;
  providerName: string;
  baseURL: string;
  apiKey: string;
  models: ProviderModel[];
}>;

export type ProviderConfigDto = {
  id: string;
  type: ConfigKind;
  providerName: string;
  baseURL: string;
  apiKeyMasked: string;
  models: ProviderModel[];
};

export type ModelOptionDto = {
  configId: string;
  configType: ConfigKind;
  providerName: string;
  modelName: string;
  label: string;
  providerId?: string;
};

export type ModelsResponseDto = {
  items: ModelOptionDto[];
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

export type ModelOptionDto = {
  configId: string;
  configType: ConfigKind;
  providerName: string;
  modelName: string;
  label: string;
  providerId?: string;
};

export type ModelsResponseDto = {
  items: ModelOptionDto[];
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

export type WorkspaceDto = {
  id: string;
  title: string;
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTextModel: string | null;
  selectedTextConfig: string | null;
  selectedTargetType: string;
  selectedImageModel: string | null;
  sourcePrompt: string;
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
  status: WorkspaceStatus;
};

export type CreateWorkspaceRequest = {
  title: string;
};

export type UpdateWorkspaceRequest = Partial<{
  title: string;
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTextModel: string | null;
  selectedTextConfig: string | null;
  selectedTargetType: string;
  selectedImageModel: string | null;
  sourcePrompt: string;
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
  status: WorkspaceStatus;
};
