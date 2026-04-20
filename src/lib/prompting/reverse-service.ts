import { ConfigType } from "@prisma/client";

import { db } from "@/lib/db";
import { ProviderMessageContentPart } from "@/lib/prompting/contracts";
import { buildReversePromptSystemPrompt } from "@/lib/prompting/system-prompts";
import { callOpenAiCompatibleProvider } from "@/lib/providers/openai-compatible";
import { decryptSecret } from "@/lib/security/crypto";
import type { PromptResult, ReversePromptRequest } from "@/lib/types";

type ReversePromptExecutionOptions = {
  signal?: AbortSignal;
};

function buildReversePromptUserContent(input: ReversePromptRequest) {
  const content: ProviderMessageContentPart[] = [
    {
      type: "text",
      text: [
        "Task:",
        "Infer a production-ready image prompt from the attached reference images.",
        `Image count: ${input.sourcePromptImages.length}`,
        input.userInstruction.trim()
          ? `Additional user instruction:\n${input.userInstruction.trim()}`
          : "Additional user instruction:\nNone"
      ].join("\n\n")
    }
  ];

  for (const image of input.sourcePromptImages) {
    content.push({
      type: "image_url",
      image_url: {
        url: image.dataUrl,
        detail: "auto"
      }
    });
  }

  return content;
}

function assertCompletedReversePromptResult(result: PromptResult) {
  if (result.status !== "completed") {
    throw new Error("Reverse prompt inference must return a completed result");
  }

  if (!result.finalPrompt?.trim()) {
    throw new Error("Reverse prompt inference must include a non-empty finalPrompt");
  }

  if (!result.summary) {
    throw new Error("Reverse prompt inference must include summary");
  }

  return result;
}

export async function runReversePromptInference(
  input: ReversePromptRequest,
  options: ReversePromptExecutionOptions = {}
) {
  const config = await db.providerConfig.findUniqueOrThrow({
    where: { id: input.selectedConfigId }
  });

  if (config.type !== ConfigType.TEXT) {
    throw new Error("Reverse prompt inference requires a text config");
  }

  const result = await callOpenAiCompatibleProvider({
    endpoint: "/v1/chat/completions",
    baseURL: config.baseUrl,
    apiKey: decryptSecret(config.apiKey),
    model: input.selectedTextModel,
    payload: {
      messages: [
        {
          role: "system",
          content: buildReversePromptSystemPrompt({
            outputLanguage: input.outputLanguage
          })
        },
        {
          role: "user",
          content: buildReversePromptUserContent(input)
        }
      ]
    },
    ...(options.signal ? { signal: options.signal } : {})
  });

  return assertCompletedReversePromptResult(result);
}
