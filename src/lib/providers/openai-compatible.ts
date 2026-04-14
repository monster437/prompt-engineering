import { ProviderInvocation } from "@/lib/prompting/contracts";
import { normalizeProviderResponse } from "@/lib/providers/normalize";

function buildProviderUrl(baseURL: string, endpoint: ProviderInvocation["endpoint"]) {
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
  const payload = input.payload as { messages?: Array<{ role: string; content: string }> };
  const systemMessages = (payload.messages ?? []).filter((message) => message.role === "system");

  return {
    model: input.model,
    ...(systemMessages.length > 0
      ? {
          instructions: systemMessages.map((message) => message.content).join("\n\n")
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

function buildResponsesInput(messages: Array<{ role: string; content: string }>) {
  const combinedInput = messages
    .filter((message) => message.role !== "system")
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join("\n\n");

  return combinedInput ? `Respond in JSON.\n\n${combinedInput}` : "Respond in JSON.";
}

async function requestResponsesApi(input: ProviderInvocation) {
  const response = await fetch(buildProviderUrl(input.baseURL, "/v1/responses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
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
