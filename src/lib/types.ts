export type ConfigKind = "text" | "image";
export type WorkspaceMode = "interview" | "optimize";
export type OutputLanguage = "zh" | "en";
export type WorkspaceStatus = "idle" | "asking" | "generating" | "refining" | "error";
export type ReverseWorkspaceStatus = "idle" | "generating" | "completed" | "error";
export const IMAGE_ASPECT_RATIOS = [
  "auto",
  "16:9@1792x1024",
  "16:9@1280x720",
  "9:16@1024x1792",
  "9:16@720x1280",
  "2:3",
  "3:2",
  "4:3",
  "3:4",
  "1:1@1024x1024"
] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];
export const MAX_SOURCE_PROMPT_IMAGES = 4;
export const MAX_SOURCE_PROMPT_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export type SourcePromptImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
};

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

export type ImageCatalogAspectRatioOptionDto = {
  value: ImageAspectRatio;
  label: string;
  resolution: string | null;
  width: number | null;
  height: number | null;
};

export type ImageCatalogProviderDto = {
  configId: string;
  providerName: string;
  baseURL: string;
  modelCount: number;
};

export type ImageCatalogItemDto = {
  configId: string;
  providerName: string;
  baseURL: string;
  modelName: string;
  label: string;
  providerId?: string;
  ability: "image";
  supportedAspectRatios: ImageAspectRatio[];
  defaultAspectRatio: ImageAspectRatio;
  defaultResolution: string | null;
};

export type ImageCatalogResponseDto = {
  defaults: {
    aspectRatio: ImageAspectRatio;
    resolution: string | null;
  };
  aspectRatios: ImageCatalogAspectRatioOptionDto[];
  providers: ImageCatalogProviderDto[];
  items: ImageCatalogItemDto[];
};

export type V1ModelDto = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  provider_name: string;
  config_id: string;
  config_type: ConfigKind;
  label: string;
  ability: ConfigKind;
  provider_id?: string;
};

export type V1ModelsResponseDto = {
  object: "list";
  data: V1ModelDto[];
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
  sourcePromptImages: SourcePromptImage[];
};

export type RefinePromptRequest = {
  workspaceId: string;
  selectedConfigId: string;
  selectedTextModel: string;
  refineInstruction: string;
};

export type ReversePromptRequest = {
  selectedConfigId: string;
  selectedTextModel: string;
  outputLanguage: OutputLanguage;
  sourcePromptImages: SourcePromptImage[];
  userInstruction: string;
};

export type GeneratedImage = {
  url: string;
};

export type GenerateImageRequest = {
  workspaceId: string;
  selectedConfigId: string;
  selectedImageModel: string;
  selectedImageAspectRatio: ImageAspectRatio;
  prompt: string;
};

export type GenerateImageResult = {
  images: GeneratedImage[];
  revisedPrompt?: string | null;
  usedPrompt?: string | null;
  promptSource?: "enhanced" | "workspace_final_prompt";
  promptEnhancementError?: string | null;
  selectedImageConfig?: string | null;
  selectedImageModel?: string | null;
  selectedImageAspectRatio?: ImageAspectRatio;
};

export type DiagnoseImageProviderRequest = {
  workspaceId: string;
  selectedConfigId: string;
  selectedImageModel: string;
};

export type DiagnoseImageProviderResult = {
  workspaceId: string;
  selectedConfigId: string;
  providerName: string;
  baseURL: string;
  selectedImageModel: string;
  connectivity: "ok" | "unauthorized" | "http_error" | "network_error";
  modelsEndpointStatus: number | null;
  modelsEndpointStatusText: string | null;
  modelFound: boolean;
  availableModelCount: number;
  similarModels: string[];
  message: string;
  details?: string;
};

export type WorkspaceDto = {
  id: string;
  title: string;
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTextModel: string | null;
  selectedTextConfig: string | null;
  selectedTargetType: string;
  selectedImageConfig: string | null;
  selectedImageAspectRatio: ImageAspectRatio;
  selectedImageModel: string | null;
  sourcePrompt: string;
  sourcePromptImages: SourcePromptImage[];
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
  generatedImageResult: GenerateImageResult | null;
  status: WorkspaceStatus;
};

export type CreateWorkspaceRequest = {
  title: string;
};

export type ReverseWorkspaceDto = {
  id: string;
  title: string;
  selectedTextConfig: string | null;
  selectedTextModel: string | null;
  outputLanguage: OutputLanguage;
  userInstruction: string;
  sourcePromptImages: SourcePromptImage[];
  result: PromptResult | null;
  errorMessage: string | null;
  status: ReverseWorkspaceStatus;
};

export type CreateReverseWorkspaceRequest = {
  title: string;
};

export type UpdateWorkspaceRequest = Partial<{
  title: string;
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTextModel: string | null;
  selectedTextConfig: string | null;
  selectedTargetType: string;
  selectedImageConfig: string | null;
  selectedImageAspectRatio: ImageAspectRatio;
  selectedImageModel: string | null;
  sourcePrompt: string;
  sourcePromptImages: SourcePromptImage[];
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
  generatedImageResult: GenerateImageResult | null;
  status: WorkspaceStatus;
}>;

export type UpdateReverseWorkspaceRequest = Partial<{
  title: string;
  selectedTextConfig: string | null;
  selectedTextModel: string | null;
  outputLanguage: OutputLanguage;
  userInstruction: string;
  sourcePromptImages: SourcePromptImage[];
  result: PromptResult | null;
  errorMessage: string | null;
  status: ReverseWorkspaceStatus;
}>;
