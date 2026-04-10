import { PromptResult } from "@/lib/types";

export type ProviderInvocation = {
  endpoint: "/v1/chat/completions" | "/v1/responses";
  baseURL: string;
  apiKey: string;
  model: string;
  payload: Record<string, unknown>;
};

export type NormalizedProviderResult = PromptResult;
