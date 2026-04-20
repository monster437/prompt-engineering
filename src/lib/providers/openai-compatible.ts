import { ProviderInvocation, ProviderMessage, ProviderMessageContentPart } from "@/lib/prompting/contracts";
import { getImageSizeForAspectRatio } from "@/lib/image-generation/catalog";
import type { DiagnoseImageProviderResult, GenerateImageResult, ImageAspectRatio } from "@/lib/types";
import { normalizeProviderResponse } from "@/lib/providers/normalize";

type ImageProviderInvocation = {
  endpoint: "/v1/images/generations";
  baseURL: string;
  apiKey: string;
  model: string;
  aspectRatio: ImageAspectRatio;
  prompt: string;
  signal?: AbortSignal;
};

type ImageProviderDiagnosticInvocation = Pick<ImageProviderInvocation, "baseURL" | "apiKey" | "model" | "signal">;
type ProviderEndpoint = ProviderInvocation["endpoint"] | ImageProviderInvocation["endpoint"] | "/v1/models";
type ImageProviderDiagnosticResult = Pick<
  DiagnoseImageProviderResult,
  | "connectivity"
  | "modelsEndpointStatus"
  | "modelsEndpointStatusText"
  | "modelFound"
  | "availableModelCount"
  | "similarModels"
  | "message"
  | "details"
>;

function buildProviderUrl(
  baseURL: string,
  endpoint: ProviderEndpoint
) {
  const normalizedBaseURL = baseURL.replace(/\/+$/, "");

  if (normalizedBaseURL.endsWith("/v1") && endpoint.startsWith("/v1/")) {
    return `${normalizedBaseURL}${endpoint.slice(3)}`;
  }

  return `${normalizedBaseURL}${endpoint}`;
}

function stringifyPreview(value: unknown) {
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 1200 ? `${serialized.slice(0, 1200)}...` : serialized;
  } catch {
    return String(value);
  }
}

function getMessageTextContent(content: ProviderMessage["content"]) {
  if (typeof content === "string") {
    return content.trim();
  }

  return content
    .filter((part): part is Extract<ProviderMessageContentPart, { type: "text" }> => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

async function readErrorDetails(response: Response) {
  try {
    const json = await response.json();
    return stringifyPreview(json);
  } catch {
    try {
      const text = await response.text();
      return text || `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}

async function requestChatCompletions(input: ProviderInvocation) {
  const response = await fetch(buildProviderUrl(input.baseURL, "/v1/chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    ...(input.signal ? { signal: input.signal } : {}),
    body: JSON.stringify({
      ...input.payload,
      model: input.model,
      response_format: {
        type: "json_object"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with ${response.status}. Details: ${await readErrorDetails(response)}`);
  }

  return response.json();
}

function buildResponsesRequestBody(input: ProviderInvocation, stream = false) {
  const payload = input.payload as { messages?: ProviderMessage[] };
  const systemMessages = (payload.messages ?? []).filter((message) => message.role === "system");

  return {
    model: input.model,
    ...(systemMessages.length > 0
      ? {
          instructions: systemMessages
            .map((message) => getMessageTextContent(message.content))
            .filter(Boolean)
            .join("\n\n")
        }
      : {}),
    input: buildResponsesInput(payload.messages ?? []),
    text: {
      format: {
        type: "json_object"
      }
    },
    ...(stream ? { stream: true } : {})
  };
}

function toResponsesContentPart(part: ProviderMessageContentPart) {
  if (part.type === "text") {
    const text = part.text.trim();
    return text ? { type: "input_text", text } : null;
  }

  const imageUrl = part.image_url.url.trim();
  if (!imageUrl) {
    return null;
  }

  return {
    type: "input_image",
    image_url: imageUrl,
    ...(part.image_url.detail ? { detail: part.image_url.detail } : {})
  };
}

type ResponsesInputContentPart = NonNullable<ReturnType<typeof toResponsesContentPart>>;
type ResponsesInputItem = {
  role: ProviderMessage["role"];
  content: ResponsesInputContentPart[];
};

function buildResponsesInput(messages: ProviderMessage[]) {
  const nonSystemMessages = messages.filter((message) => message.role !== "system");
  const allTextOnly = nonSystemMessages.every((message) => typeof message.content === "string");

  if (allTextOnly) {
    const combinedInput = messages
      .filter((message) => message.role !== "system")
      .map((message) => getMessageTextContent(message.content))
      .filter(Boolean)
      .join("\n\n");

    return combinedInput ? `Respond in JSON.\n\n${combinedInput}` : "Respond in JSON.";
  }

  const inputItems: ResponsesInputItem[] = nonSystemMessages.flatMap((message) => {
      const content =
        typeof message.content === "string"
          ? message.content.trim()
            ? [{ type: "input_text", text: message.content.trim() }]
            : []
          : message.content
              .map(toResponsesContentPart)
              .filter((part): part is NonNullable<ReturnType<typeof toResponsesContentPart>> => Boolean(part));

      return content.length > 0
        ? [{
            role: message.role,
            content
          }]
        : [];
    });

  if (inputItems.length === 0) {
    return "Respond in JSON.";
  }

  inputItems[0] = {
    ...inputItems[0],
    content: [{ type: "input_text", text: "Respond in JSON." }, ...inputItems[0].content]
  };

  return inputItems;
}

async function requestResponsesApi(input: ProviderInvocation) {
  const response = await fetch(buildProviderUrl(input.baseURL, "/v1/responses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    ...(input.signal ? { signal: input.signal } : {}),
    body: JSON.stringify(buildResponsesRequestBody(input))
  });

  if (!response.ok) {
    throw new Error(`Responses API request failed with ${response.status}. Details: ${await readErrorDetails(response)}`);
  }

  return response.json();
}

function extractResponsesOutputTextFromStream(rawStream: string) {
  let outputText = "";

  for (const block of rawStream.split(/\r?\n\r?\n/)) {
    const dataPayload = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!dataPayload || dataPayload === "[DONE]") {
      continue;
    }

    try {
      const event = JSON.parse(dataPayload) as Record<string, any>;

      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        outputText += event.delta;
        continue;
      }

      if (!outputText && event.type === "response.output_text.done" && typeof event.text === "string") {
        outputText = event.text;
        continue;
      }

      if (
        !outputText &&
        event.type === "response.content_part.done" &&
        event.part?.type === "output_text" &&
        typeof event.part.text === "string"
      ) {
        outputText = event.part.text;
      }
    } catch {
      continue;
    }
  }

  return outputText.trim();
}

async function requestResponsesApiStream(input: ProviderInvocation) {
  const response = await fetch(buildProviderUrl(input.baseURL, "/v1/responses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    ...(input.signal ? { signal: input.signal } : {}),
    body: JSON.stringify(buildResponsesRequestBody(input, true))
  });

  if (!response.ok) {
    throw new Error(`Responses API stream request failed with ${response.status}. Details: ${await readErrorDetails(response)}`);
  }

  const rawStream = await response.text();
  return {
    rawStream,
    outputText: extractResponsesOutputTextFromStream(rawStream)
  };
}

async function requestImageGeneration(input: ImageProviderInvocation) {
  const requestBody: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt
  };

  if (isXaiImageRequest(input)) {
    requestBody.aspect_ratio = input.aspectRatio;
  } else {
    const mappedSize = getImageSizeForAspectRatio(input.aspectRatio);
    if (mappedSize) {
      requestBody.size = mappedSize;
    }
  }

  const response = await fetch(buildProviderUrl(input.baseURL, input.endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    ...(input.signal ? { signal: input.signal } : {}),
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Image generation request failed with ${response.status}. Details: ${await readErrorDetails(response)}`);
  }

  return response.json();
}

function normalizeModelIds(payload: unknown) {
  const rawItems = Array.isArray((payload as { data?: unknown[] } | null)?.data)
    ? ((payload as { data: unknown[] }).data ?? [])
    : Array.isArray(payload)
      ? payload
      : [];

  return Array.from(
    new Set(
      rawItems.flatMap((item) => {
        if (typeof item === "string" && item.trim()) {
          return [item.trim()];
        }

        if (
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof (item as { id?: unknown }).id === "string" &&
          (item as { id: string }).id.trim()
        ) {
          return [(item as { id: string }).id.trim()];
        }

        return [];
      })
    )
  );
}

function buildSimilarModels(models: string[], targetModel: string) {
  const normalizedTarget = targetModel.trim().toLowerCase();
  const targetTokens = normalizedTarget.split(/[^a-z0-9]+/i).filter(Boolean);

  return models
    .map((model) => {
      const normalizedModel = model.toLowerCase();
      let score = 0;

      if (normalizedModel === normalizedTarget) {
        score += 100;
      }

      if (normalizedTarget && normalizedModel.includes(normalizedTarget)) {
        score += 40;
      }

      for (const token of targetTokens) {
        if (normalizedModel.includes(token)) {
          score += token.length >= 4 ? 8 : 4;
        }
      }

      if (/image|img|vision|grok|flux|dall|stable|sd/i.test(model)) {
        score += 2;
      }

      return { model, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.model.localeCompare(right.model))
    .slice(0, 10)
    .map((item) => item.model);
}

export async function diagnoseOpenAiCompatibleImageProvider(
  input: ImageProviderDiagnosticInvocation
): Promise<ImageProviderDiagnosticResult> {
  let response: Response;

  try {
    response = await fetch(buildProviderUrl(input.baseURL, "/v1/models"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.apiKey}`
      },
      ...(input.signal ? { signal: input.signal } : {})
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return {
      connectivity: "network_error",
      modelsEndpointStatus: null,
      modelsEndpointStatusText: null,
      modelFound: false,
      availableModelCount: 0,
      similarModels: [],
      message: "图片通道诊断失败：无法连接到 provider，请检查 baseURL、网络或代理配置。",
      details
    };
  }

  if (!response.ok) {
    const details = await readErrorDetails(response);
    const connectivity = response.status === 401 || response.status === 403 ? "unauthorized" : "http_error";

    return {
      connectivity,
      modelsEndpointStatus: response.status,
      modelsEndpointStatusText: response.statusText || null,
      modelFound: false,
      availableModelCount: 0,
      similarModels: [],
      message:
        connectivity === "unauthorized"
          ? "图片通道诊断失败：provider 可达，但 token 无效、过期或没有访问模型列表的权限。"
          : "图片通道诊断失败：provider 已响应，但模型列表接口返回了异常状态码。",
      details
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return {
      connectivity: "http_error",
      modelsEndpointStatus: response.status,
      modelsEndpointStatusText: response.statusText || null,
      modelFound: false,
      availableModelCount: 0,
      similarModels: [],
      message: "图片通道诊断失败：provider 已响应，但模型列表响应无法解析。",
      details
    };
  }

  const models = normalizeModelIds(payload);
  const modelFound = models.includes(input.model);
  const similarModels = buildSimilarModels(models, input.model);

  if (modelFound) {
    return {
      connectivity: "ok",
      modelsEndpointStatus: response.status,
      modelsEndpointStatusText: response.statusText || null,
      modelFound: true,
      availableModelCount: models.length,
      similarModels,
      message: "图片通道诊断成功：provider 可达、token 有效，且已找到目标模型。"
    };
  }

  return {
    connectivity: "ok",
    modelsEndpointStatus: response.status,
    modelsEndpointStatusText: response.statusText || null,
    modelFound: false,
    availableModelCount: models.length,
    similarModels,
    message:
      models.length > 0
        ? "图片通道可达、token 看起来有效，但未在模型列表中找到当前选择的图像模型。"
        : "图片通道可达、token 看起来有效，但模型列表为空或未返回可识别模型。",
    details: stringifyPreview(payload)
  };
}

function isXaiImageRequest(input: Pick<ImageProviderInvocation, "baseURL" | "model">) {
  return /(^https?:\/\/)?api\.x\.ai(\/|$)/i.test(input.baseURL.trim()) || /^grok-imagine-image/i.test(input.model);
}

function normalizeImageProviderResponse(payload: Record<string, any>): GenerateImageResult {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const images = data.flatMap((item: Record<string, any>) => {
    if (typeof item?.url === "string" && item.url.trim()) {
      return [{ url: item.url.trim() }];
    }

    if (typeof item?.b64_json === "string" && item.b64_json.trim()) {
      const mimeType =
        typeof item?.mime_type === "string" && item.mime_type.trim()
          ? item.mime_type.trim()
          : "image/png";

      return [{ url: `data:${mimeType};base64,${item.b64_json.trim()}` }];
    }

    return [];
  });

  if (images.length === 0) {
    throw new Error("Unsupported image provider response shape");
  }

  const revisedPrompt =
    data.find((item: Record<string, any>) => typeof item?.revised_prompt === "string" && item.revised_prompt.trim())
      ?.revised_prompt ?? null;

  return {
    images,
    revisedPrompt
  };
}

export async function callOpenAiCompatibleProvider(input: ProviderInvocation) {
  const chatJson = await requestChatCompletions(input);

  try {
    return normalizeProviderResponse(chatJson);
  } catch (error) {
    const fallbackNeeded =
      input.endpoint === "/v1/chat/completions" &&
      chatJson?.object === "chat.completion" &&
      chatJson?.choices?.[0]?.message?.content == null;

    if (fallbackNeeded) {
      const responsesJson = await requestResponsesApi(input);
      try {
        return normalizeProviderResponse(responsesJson);
      } catch (fallbackError) {
        const hasEmptyCompletedOutput =
          responsesJson?.object === "response" &&
          responsesJson?.status === "completed" &&
          Array.isArray(responsesJson?.output) &&
          responsesJson.output.length === 0;
        const fallbackMessage =
          hasEmptyCompletedOutput
            ? "Responses API completed without textual output"
            : fallbackError instanceof Error
              ? fallbackError.message
              : "Failed to normalize responses API response";

        try {
          const streamResult = await requestResponsesApiStream(input);

          if (streamResult.outputText) {
            try {
              return normalizeProviderResponse({
                output: [
                  {
                    type: "message",
                    content: [{ type: "output_text", text: streamResult.outputText }]
                  }
                ]
              });
            } catch (streamError) {
              const streamMessage =
                streamError instanceof Error
                  ? streamError.message
                  : "Failed to normalize responses API stream output";
              throw new Error(
                `${streamMessage}. Raw response preview: ${stringifyPreview(responsesJson)}. Raw stream preview: ${stringifyPreview(streamResult.rawStream)}`
              );
            }
          }

          throw new Error(
            `${fallbackMessage}. Raw response preview: ${stringifyPreview(responsesJson)}. Raw stream preview: ${stringifyPreview(streamResult.rawStream)}`
          );
        } catch (streamFallbackError) {
          if (streamFallbackError instanceof Error && streamFallbackError.message.includes("Raw stream preview:")) {
            throw streamFallbackError;
          }

          const streamMessage =
            streamFallbackError instanceof Error
              ? streamFallbackError.message
              : "Responses API stream fallback failed";
          throw new Error(
            `${fallbackMessage}. Raw response preview: ${stringifyPreview(responsesJson)}. Stream fallback failed: ${streamMessage}`
          );
        }
      }
    }

    const message = error instanceof Error ? error.message : "Failed to normalize provider response";
    throw new Error(`${message}. Raw response preview: ${stringifyPreview(chatJson)}`);
  }
}

export async function callOpenAiCompatibleImageProvider(input: ImageProviderInvocation) {
  const imageJson = await requestImageGeneration(input);

  try {
    return normalizeImageProviderResponse(imageJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to normalize image provider response";
    throw new Error(`${message}. Raw response preview: ${stringifyPreview(imageJson)}`);
  }
}
