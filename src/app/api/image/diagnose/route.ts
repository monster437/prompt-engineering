import { jsonError } from "@/lib/http/errors";
import { diagnoseImageProviderSchema } from "@/lib/http/validators";
import { runDiagnoseImageProvider } from "@/lib/image-generation/service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid image diagnose payload", 400);
  }

  const payload = diagnoseImageProviderSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid image diagnose payload", 400);
  }

  try {
    const result = await runDiagnoseImageProvider(payload.data);
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Image diagnose failed", 500);
  }
}
