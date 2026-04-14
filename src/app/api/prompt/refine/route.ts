import { jsonError } from "@/lib/http/errors";
import { refinePromptSchema } from "@/lib/http/validators";
import { runRefinePrompt } from "@/lib/prompting/service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid prompt payload", 400);
  }

  const payload = refinePromptSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid prompt payload", 400);
  }

  try {
    const result = await runRefinePrompt(payload.data);
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Prompt refine failed", 500);
  }
}
