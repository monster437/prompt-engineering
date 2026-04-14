import type {
  CreateProviderConfigRequest,
  ProviderConfigDto,
  UpdateProviderConfigRequest
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

  return "请求失败";
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

export function listConfigs(): Promise<ProviderConfigDto[]> {
  return requestJson<ProviderConfigDto[]>("/api/configs", { method: "GET" });
}

export function createConfig(payload: CreateProviderConfigRequest): Promise<ProviderConfigDto> {
  return requestJson<ProviderConfigDto>("/api/configs", withJsonBody("POST", payload));
}

export function updateConfig(id: string, payload: UpdateProviderConfigRequest): Promise<ProviderConfigDto> {
  return requestJson<ProviderConfigDto>(`/api/configs/${id}`, withJsonBody("PATCH", payload));
}

export async function deleteConfig(id: string): Promise<void> {
  const response = await fetch(`/api/configs/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
