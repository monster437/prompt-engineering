import type {
  CreateWorkspaceRequest,
  GeneratePromptRequest,
  ModelOptionDto,
  ModelsResponseDto,
  PromptResult,
  RefinePromptRequest,
  UpdateWorkspaceRequest,
  WorkspaceDto
} from "@/lib/types";

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore parsing failures and fall back to the generic message.
  }

  return "Request failed";
}

async function requestJson<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return readJson<T>(response);
}

function withJsonBody(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export function listWorkspaces(): Promise<WorkspaceDto[]> {
  return requestJson<WorkspaceDto[]>("/api/workspaces", { method: "GET" });
}

export function createWorkspace(payload: CreateWorkspaceRequest): Promise<WorkspaceDto> {
  return requestJson<WorkspaceDto>("/api/workspaces", withJsonBody("POST", payload));
}

export function updateWorkspace(id: string, payload: UpdateWorkspaceRequest): Promise<WorkspaceDto> {
  return requestJson<WorkspaceDto>(`/api/workspaces/${id}`, withJsonBody("PATCH", payload));
}

export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function listModelOptions(): Promise<ModelOptionDto[]> {
  const response = await requestJson<ModelsResponseDto>("/api/models", { method: "GET" });
  return response.items;
}

export function generatePrompt(payload: GeneratePromptRequest): Promise<PromptResult> {
  return requestJson<PromptResult>("/api/prompt/generate", withJsonBody("POST", payload));
}

export function refinePrompt(payload: RefinePromptRequest): Promise<PromptResult> {
  return requestJson<PromptResult>("/api/prompt/refine", withJsonBody("POST", payload));
}
