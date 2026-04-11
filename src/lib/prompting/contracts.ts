import { OutputLanguage, PromptResult, PromptSummary, WorkspaceMode } from "@/lib/types";

export const MAX_INTERVIEW_ROUNDS = 3;

export type ProviderInvocation = {
  endpoint: "/v1/chat/completions" | "/v1/responses";
  baseURL: string;
  apiKey: string;
  model: string;
  payload: Record<string, unknown>;
};

export type PromptingWorkspaceSnapshot = {
  mode: WorkspaceMode;
  outputLanguage: OutputLanguage;
  selectedTargetType: string;
  sourcePrompt: string;
  questionMessages: string[];
  answers: string[];
  finalPrompt: string | null;
  parameterSummary: PromptSummary | null;
  refineInstruction: string | null;
};

export type PromptingProviderConfig = Pick<ProviderInvocation, "endpoint" | "baseURL" | "apiKey" | "model">;

export type PromptAction = "optimize" | "interview" | "refine";

export type PromptOrchestratorInput = {
  action: PromptAction;
  workspace: PromptingWorkspaceSnapshot;
  provider: PromptingProviderConfig;
};

export type NormalizedProviderResult = PromptResult;
