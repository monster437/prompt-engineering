import { jsonError } from "@/lib/http/errors";
import { generateImageSchema } from "@/lib/http/validators";
import { runGenerateImage } from "@/lib/image-generation/service";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid image payload", 400);
  }

  const payload = generateImageSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid image payload", 400);
  }

  try {
    const result = await runGenerateImage(payload.data, { signal: request.signal });
    return Response.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Image generation failed", 500);
  }
}
