import { ProviderInvocation } from "@/lib/prompting/contracts";
import { normalizeProviderResponse } from "@/lib/providers/normalize";

export async function callOpenAiCompatibleProvider(input: ProviderInvocation) {
  const response = await fetch(`${input.baseURL}${input.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      ...input.payload,
      model: input.model
    })
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with ${response.status}`);
  }

  const json = await response.json();
  return normalizeProviderResponse(json);
}
