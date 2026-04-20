import { jsonError } from "@/lib/http/errors";
import { generatePromptSchema } from "@/lib/http/validators";
import { runGeneratePrompt } from "@/lib/prompting/service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid prompt payload", 400);
  }

  const payload = generatePromptSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid prompt payload", 400);
  }

  try {
    const result = await runGeneratePrompt(payload.data, { signal: request.signal });
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Prompt generation failed", 500);
  }
}
