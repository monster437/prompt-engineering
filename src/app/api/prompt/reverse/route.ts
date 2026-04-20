import { jsonError } from "@/lib/http/errors";
import { reversePromptSchema } from "@/lib/http/validators";
import { runReversePromptInference } from "@/lib/prompting/reverse-service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid prompt payload", 400);
  }

  const payload = reversePromptSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid prompt payload", 400);
  }

  try {
    const result = await runReversePromptInference(payload.data, { signal: request.signal });
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Prompt reverse failed", 500);
  }
}
