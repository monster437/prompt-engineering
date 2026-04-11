import { OutputLanguage } from "@/lib/types";

type PromptTemplateInput = {
  outputLanguage: OutputLanguage;
  targetType: string;
};

type InterviewPromptTemplateInput = PromptTemplateInput & {
  canAskFollowUp: boolean;
};

function describeLanguage(outputLanguage: OutputLanguage) {
  return outputLanguage === "zh" ? "中文" : "English";
}

function buildSharedContractInstructions({ outputLanguage, targetType }: PromptTemplateInput) {
  return [
    `Write the final prompt for the ${targetType} target type.`,
    `Use ${describeLanguage(outputLanguage)} for all user-visible fields.`,
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
