import { NormalizedProviderResult } from "@/lib/prompting/contracts";

function parseResult(text: string): NormalizedProviderResult {
  return JSON.parse(text) as NormalizedProviderResult;
}

export function normalizeProviderResponse(payload: Record<string, any>): NormalizedProviderResult {
  if (payload.choices?.[0]?.message?.content) {
    return parseResult(payload.choices[0].message.content);
  }

  const outputText = payload.output?.[0]?.content?.find((item: any) => item.type === "output_text")?.text;
  if (outputText) {
    return parseResult(outputText);
  }

  throw new Error("Unsupported provider response shape");
}
