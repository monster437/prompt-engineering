import {
  ImageAspectRatio,
  OutputLanguage,
  PromptResult,
  PromptSummary,
  SourcePromptImage,
  WorkspaceMode
} from "@/lib/types";

export const MAX_INTERVIEW_ROUNDS = 3;

export type ProviderMessageContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
        detail?: "auto" | "low" | "high";
      };
    };

export type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string | ProviderMessageContentPart[];
};

export type ProviderInvocation = {
  endpoint: "/v1/chat/completions" | "/v1/responses";
  baseURL: string;
  apiKey: string;
  model: string;
  payload: Record<string, unknown>;
  signal?: AbortSignal;
};

export type PromptingWorkspaceSnapshot = {
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTargetType: string;
  selectedImageAspectRatio: ImageAspectRatio;
  sourcePrompt: string;
  sourcePromptImages: SourcePromptImage[];
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
};

export type PromptingProviderConfig = Pick<ProviderInvocation, "endpoint" | "baseURL" | "apiKey" | "model" | "signal">;

export type PromptAction = "optimize" | "interview" | "refine";

export type PromptOrchestratorInput = {
  action: PromptAction;
  workspace: PromptingWorkspaceSnapshot;
  provider: PromptingProviderConfig;
};

export type NormalizedProviderResult = PromptResult;
