import { ImageAspectRatio, OutputLanguage } from "@/lib/types";
import { getDisplayAspectRatio } from "@/lib/image-generation/catalog";
import {
  formatSelectedStyleLabels,
  formatSelectedStylePromptHints,
  getResolvedCameraOrientationLabel,
  getResolvedCameraOrientationPromptHint
} from "@/lib/style-tags";

type PromptTemplateInput = {
  outputLanguage: OutputLanguage;
  targetType: string;
  aspectRatio: ImageAspectRatio;
};

type InterviewPromptTemplateInput = PromptTemplateInput & {
  canAskFollowUp: boolean;
};

type ReversePromptTemplateInput = {
  outputLanguage: OutputLanguage;
};

function describeLanguage(outputLanguage: OutputLanguage) {
  return outputLanguage === "zh" ? "中文" : "English";
}

function buildAspectRatioInstructions(aspectRatio: ImageAspectRatio) {
  const displayAspectRatio = getDisplayAspectRatio(aspectRatio);

  if (displayAspectRatio === "auto") {
    return "If the user did not specify an aspect ratio, avoid inventing a conflicting hard-coded ratio in finalPrompt or summary.composition.";
  }

  return [
    `The required image aspect ratio is ${displayAspectRatio}.`,
    `The finalPrompt and summary.composition must match ${displayAspectRatio}.`,
    `Do not mention any conflicting aspect ratio such as 2:5, 9:16, 16:9, 4:3, 3:4, 3:2, or 2:3 unless it is exactly ${displayAspectRatio}.`
  ].join("\n");
}

function buildSharedContractInstructions({ outputLanguage, targetType, aspectRatio }: PromptTemplateInput) {
  const selectedStyleLabels = formatSelectedStyleLabels(targetType);
  const selectedStyleHints = formatSelectedStylePromptHints(targetType);

  return [
    `Write the final prompt for the selected style tags: ${selectedStyleLabels}.`,
    `Treat the style tags as a combined aesthetic brief: ${selectedStyleHints}.`,
    `Selected camera orientation: ${getResolvedCameraOrientationLabel(targetType)}.`,
    `Camera orientation guidance: ${getResolvedCameraOrientationPromptHint(targetType)}.`,
    "Preserve the user's explicit main subject from the source prompt and reference images.",
    "If the source prompt does not explicitly mention one, do not invent a human, character, traveler, creature, portrait, body, or silhouette as a new main subject.",
    "Manual character or figure camera orientations count as explicit composition instructions; auto camera mode does not.",
    "For scale in non-character prompts, prefer environmental anchors such as ruins, cliffs, architecture, celestial bodies, waves, gates, light beams, or spatial boundaries.",
    `Use ${describeLanguage(outputLanguage)} for all user-visible fields.`,
    buildAspectRatioInstructions(aspectRatio),
    "Return JSON only.",
    'The JSON must match {"status":"needs_clarification"|"completed","question"?:string,"finalPrompt"?:string,"summary"?:{"style":string,"scene":string,"time":string,"mood":string,"quality":string,"composition":string,"extras":string[]},"contextSnapshot":Record<string,unknown>}.',
    "Always include summary and contextSnapshot when status is completed."
  ].join("\n");
}

export function buildOptimizeSystemPrompt(input: PromptTemplateInput) {
  return [
    "You expand short image ideas into polished production-ready prompts.",
    buildSharedContractInstructions(input),
    "Status must be completed.",
    "Produce a strong, detailed, visually rich finalPrompt."
  ].join("\n\n");
}

export function buildInterviewSystemPrompt(input: InterviewPromptTemplateInput) {
  return [
    "You help the user reach a complete image prompt through adaptive questioning.",
    buildSharedContractInstructions(input),
    "Ask at most one question per turn.",
    "Ask only the highest-value missing detail if clarification is still needed.",
    input.canAskFollowUp
      ? "You may return needs_clarification when required."
      : "Do not ask another question. Produce the best possible completed result now."
  ].join("\n\n");
}

export function buildRefineSystemPrompt(input: PromptTemplateInput) {
  return [
    "你要根据用户的修改指令修改现有提示词，而不是从零开始重写上下文。",
    buildSharedContractInstructions(input),
    "Status must be completed.",
    "Update the finalPrompt and summary to reflect the refine instruction."
  ].join("\n\n");
}

export function buildReversePromptSystemPrompt(input: ReversePromptTemplateInput) {
  return [
    "You infer likely image-generation prompts from one or more reference images.",
    `Use ${describeLanguage(input.outputLanguage)} for all user-visible fields.`,
    "Focus only on what is visually supported by the images and any explicit extra user instruction.",
    "If multiple images are provided, merge their shared traits into one coherent prompt unless the user explicitly asks for separation.",
    "Do not mention that the prompt is inferred, guessed, reverse-engineered, or based on attached images.",
    "Write a production-ready finalPrompt that another image model can directly use.",
    "summary.style should describe the visual style or rendering style.",
    "summary.scene should describe the main subject and scene setting.",
    "summary.time should describe time of day or the dominant lighting period.",
    "summary.mood should describe atmosphere and emotion.",
    "summary.quality should describe detail level, rendering fidelity, texture, or finish.",
    "summary.composition should describe framing, viewpoint, lens feel, and composition.",
    "summary.extras should capture notable props, costume details, materials, color palette, effects, or secondary cues.",
    "Return JSON only.",
    'The JSON must match {"status":"completed","finalPrompt":string,"summary":{"style":string,"scene":string,"time":string,"mood":string,"quality":string,"composition":string,"extras":string[]},"contextSnapshot":Record<string,unknown>}.',
    "Status must always be completed.",
    "Always include contextSnapshot with concise structured evidence such as imageCount, observedSubjects, palette, lighting, or camera hints."
  ].join("\n\n");
}
