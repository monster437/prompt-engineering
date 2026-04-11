import {
  MAX_INTERVIEW_ROUNDS,
  PromptOrchestratorInput,
  ProviderInvocation
} from "@/lib/prompting/contracts";
import { callOpenAiCompatibleProvider } from "@/lib/providers/openai-compatible";
import {
  buildInterviewSystemPrompt,
  buildOptimizeSystemPrompt,
  buildRefineSystemPrompt
} from "@/lib/prompting/system-prompts";

function buildUserMessage(input: PromptOrchestratorInput) {
  if (input.action === "optimize") {
    return `Source prompt:\n${input.workspace.sourcePrompt}`;
  }

  if (input.action === "interview") {
    return [
      `Source prompt:\n${input.workspace.sourcePrompt}`,
      `Previous questions:\n${JSON.stringify(input.workspace.questionMessages)}`,
      `Previous answers:\n${JSON.stringify(input.workspace.answers)}`
    ].join("\n\n");
  }

  return [
    `Current final prompt:\n${input.workspace.finalPrompt ?? ""}`,
    `Current summary:\n${JSON.stringify(input.workspace.parameterSummary)}`,
    `Refine instruction:\n${input.workspace.refineInstruction ?? ""}`
  ].join("\n\n");
}

function buildSystemPrompt(input: PromptOrchestratorInput) {
  if (input.action === "optimize") {
    return buildOptimizeSystemPrompt({
      outputLanguage: input.workspace.outputLanguage,
      targetType: input.workspace.selectedTargetType
    });
  }

  if (input.action === "interview") {
    return buildInterviewSystemPrompt({
      outputLanguage: input.workspace.outputLanguage,
      targetType: input.workspace.selectedTargetType,
      canAskFollowUp: input.workspace.answers.length < MAX_INTERVIEW_ROUNDS
    });
  }

  return buildRefineSystemPrompt({
    outputLanguage: input.workspace.outputLanguage,
    targetType: input.workspace.selectedTargetType
  });
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
        { role: "user", content: buildUserMessage(input) }
      ]
    }
  };

  const result = await callOpenAiCompatibleProvider(providerInput);

  if (input.action === "interview" && input.workspace.answers.length < MAX_INTERVIEW_ROUNDS) {
    return result;
  }

  return assertCompletedResult(input.action, result);
}
