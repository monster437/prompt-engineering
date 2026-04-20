import type {
  CreateReverseWorkspaceRequest,
  CreateWorkspaceRequest,
  DiagnoseImageProviderRequest,
  DiagnoseImageProviderResult,
  GenerateImageRequest,
  GenerateImageResult,
  GeneratePromptRequest,
  ModelOptionDto,
  ModelsResponseDto,
  PromptResult,
  ReversePromptRequest,
  ReverseWorkspaceDto,
  RefinePromptRequest,
  UpdateReverseWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceDto
} from "@/lib/types";

type RequestOptions = {
  signal?: AbortSignal;
};

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

function withJsonBody(method: string, body: unknown, options: RequestOptions = {}): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...(options.signal ? { signal: options.signal } : {})
  };
}

export function listWorkspaces(): Promise<WorkspaceDto[]> {
  return requestJson<WorkspaceDto[]>("/api/workspaces", { method: "GET" });
}

export function listReverseWorkspaces(): Promise<ReverseWorkspaceDto[]> {
  return requestJson<ReverseWorkspaceDto[]>("/api/reverse-workspaces", { method: "GET" });
}

export function createWorkspace(payload: CreateWorkspaceRequest): Promise<WorkspaceDto> {
  return requestJson<WorkspaceDto>("/api/workspaces", withJsonBody("POST", payload));
}

export function createReverseWorkspace(
  payload: CreateReverseWorkspaceRequest
): Promise<ReverseWorkspaceDto> {
  return requestJson<ReverseWorkspaceDto>("/api/reverse-workspaces", withJsonBody("POST", payload));
}

export function updateWorkspace(id: string, payload: UpdateWorkspaceRequest): Promise<WorkspaceDto> {
  return requestJson<WorkspaceDto>(`/api/workspaces/${id}`, withJsonBody("PATCH", payload));
}

export function updateReverseWorkspace(
  id: string,
  payload: UpdateReverseWorkspaceRequest
): Promise<ReverseWorkspaceDto> {
  return requestJson<ReverseWorkspaceDto>(
    `/api/reverse-workspaces/${id}`,
    withJsonBody("PATCH", payload)
  );
}

export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function deleteReverseWorkspace(id: string): Promise<void> {
  const response = await fetch(`/api/reverse-workspaces/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function listModelOptions(): Promise<ModelOptionDto[]> {
  const response = await requestJson<ModelsResponseDto>("/api/models", { method: "GET" });
  return response.items;
}

export function refinePrompt(payload: RefinePromptRequest): Promise<PromptResult> {
  return requestJson<PromptResult>("/api/prompt/refine", withJsonBody("POST", payload));
}

export function generatePrompt(payload: GeneratePromptRequest, options: RequestOptions = {}): Promise<PromptResult> {
  return requestJson<PromptResult>("/api/prompt/generate", withJsonBody("POST", payload, options));
}

export function reversePrompt(payload: ReversePromptRequest, options: RequestOptions = {}): Promise<PromptResult> {
  return requestJson<PromptResult>("/api/prompt/reverse", withJsonBody("POST", payload, options));
}

export function generateImage(payload: GenerateImageRequest, options: RequestOptions = {}): Promise<GenerateImageResult> {
  return requestJson<GenerateImageResult>("/api/image/generate", withJsonBody("POST", payload, options));
}

export function diagnoseImageProvider(payload: DiagnoseImageProviderRequest): Promise<DiagnoseImageProviderResult> {
  return requestJson<DiagnoseImageProviderResult>("/api/image/diagnose", withJsonBody("POST", payload));
}
