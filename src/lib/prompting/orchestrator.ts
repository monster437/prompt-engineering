import {
  MAX_INTERVIEW_ROUNDS,
  ProviderMessageContentPart,
  PromptOrchestratorInput,
  ProviderInvocation
} from "@/lib/prompting/contracts";
import { callOpenAiCompatibleProvider } from "@/lib/providers/openai-compatible";
import {
  buildInterviewSystemPrompt,
  buildOptimizeSystemPrompt,
  buildRefineSystemPrompt
} from "@/lib/prompting/system-prompts";
import { getResolvedCameraOrientationLabel } from "@/lib/style-tags";

const ASPECT_RATIO_PATTERN = /\b\d+\s*[:：]\s*\d+\b/g;

function buildSourcePromptText(sourcePrompt: string) {
  return sourcePrompt.trim() ? sourcePrompt : "(No text provided; rely on the attached reference images.)";
}

function buildReferenceImageHint(referenceImageCount: number) {
  return referenceImageCount > 0
    ? `Reference images attached:\n${referenceImageCount}`
    : "Reference images attached:\n0";
}

function buildUserMessageText(input: PromptOrchestratorInput) {
  const selectedCameraOrientationLabel = getResolvedCameraOrientationLabel(input.workspace.selectedTargetType);
  const referenceImageHint = buildReferenceImageHint(input.workspace.sourcePromptImages.length);

  if (input.action === "optimize") {
    return [
      `Source prompt:\n${buildSourcePromptText(input.workspace.sourcePrompt)}`,
      referenceImageHint,
      `Selected aspect ratio:\n${input.workspace.selectedImageAspectRatio}`,
      `Selected camera orientation:\n${selectedCameraOrientationLabel}`
    ].join("\n\n");
  }

  if (input.action === "interview") {
    return [
      `Source prompt:\n${buildSourcePromptText(input.workspace.sourcePrompt)}`,
      referenceImageHint,
      `Selected aspect ratio:\n${input.workspace.selectedImageAspectRatio}`,
      `Selected camera orientation:\n${selectedCameraOrientationLabel}`,
      `Previous questions:\n${JSON.stringify(input.workspace.questionMessages)}`,
      `Previous answers:\n${JSON.stringify(input.workspace.answers)}`
    ].join("\n\n");
  }

  return [
    `Original source prompt:\n${buildSourcePromptText(input.workspace.sourcePrompt)}`,
    referenceImageHint,
    `Current final prompt:\n${input.workspace.finalPrompt ?? ""}`,
    `Current summary:\n${JSON.stringify(input.workspace.parameterSummary)}`,
    `Selected aspect ratio:\n${input.workspace.selectedImageAspectRatio}`,
    `Selected camera orientation:\n${selectedCameraOrientationLabel}`,
    `Refine instruction:\n${input.workspace.refineInstruction ?? ""}`
  ].join("\n\n");
}

function buildUserMessageContent(input: PromptOrchestratorInput) {
  const text = buildUserMessageText(input);

  if (input.workspace.sourcePromptImages.length === 0) {
    return text;
  }

  const content: ProviderMessageContentPart[] = [{ type: "text", text }];

  for (const image of input.workspace.sourcePromptImages) {
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

function buildSystemPrompt(input: PromptOrchestratorInput) {
  if (input.action === "optimize") {
    return buildOptimizeSystemPrompt({
      outputLanguage: input.workspace.outputLanguage,
      targetType: input.workspace.selectedTargetType,
      aspectRatio: input.workspace.selectedImageAspectRatio
    });
  }

  if (input.action === "interview") {
    return buildInterviewSystemPrompt({
      outputLanguage: input.workspace.outputLanguage,
      targetType: input.workspace.selectedTargetType,
      aspectRatio: input.workspace.selectedImageAspectRatio,
      canAskFollowUp: input.workspace.answers.length < MAX_INTERVIEW_ROUNDS
    });
  }

  return buildRefineSystemPrompt({
    outputLanguage: input.workspace.outputLanguage,
    targetType: input.workspace.selectedTargetType,
    aspectRatio: input.workspace.selectedImageAspectRatio
  });
}

function normalizeAspectRatioText(text: string, aspectRatio: PromptOrchestratorInput["workspace"]["selectedImageAspectRatio"]) {
  if (aspectRatio === "auto") {
    return text;
  }

  return text.replace(ASPECT_RATIO_PATTERN, aspectRatio);
}

function normalizeAspectRatioResult(
  result: Awaited<ReturnType<typeof callOpenAiCompatibleProvider>>,
  aspectRatio: PromptOrchestratorInput["workspace"]["selectedImageAspectRatio"]
) {
  if (result.status !== "completed" || aspectRatio === "auto") {
    return result;
  }

  return {
    ...result,
    finalPrompt: result.finalPrompt ? normalizeAspectRatioText(result.finalPrompt, aspectRatio) : result.finalPrompt,
    summary: result.summary
      ? {
          ...result.summary,
          composition: normalizeAspectRatioText(result.summary.composition, aspectRatio)
        }
      : result.summary
  };
}

function assertCompletedResult(
  action: PromptOrchestratorInput["action"],
  result: Awaited<ReturnType<typeof callOpenAiCompatibleProvider>>
) {
  if (result.status === "completed") {
    return result;
  }

  if (action === "refine") {
    throw new Error("Refine must return a completed result");
  }

  if (action === "optimize") {
    throw new Error("Optimize must return a completed result");
  }

  throw new Error("Interview must return a completed result after the round limit");
}

export async function runPromptOrchestration(input: PromptOrchestratorInput) {
  const providerInput: ProviderInvocation = {
    ...input.provider,
    payload: {
      messages: [
        { role: "system", content: buildSystemPrompt(input) },
        { role: "user", content: buildUserMessageContent(input) }
      ]
    }
  };

  const result = await callOpenAiCompatibleProvider(providerInput);
  const normalizedResult = normalizeAspectRatioResult(result, input.workspace.selectedImageAspectRatio);

  if (input.action === "interview" && input.workspace.answers.length < MAX_INTERVIEW_ROUNDS) {
    return normalizedResult;
  }

  return assertCompletedResult(input.action, normalizedResult);
}
