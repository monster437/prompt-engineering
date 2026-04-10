import { ConfigType } from "@prisma/client";
import { createConfig, listConfigs } from "@/lib/configs";
import { jsonError } from "@/lib/http/errors";
import { configSchema } from "@/lib/http/validators";

export async function GET() {
  return Response.json(await listConfigs());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid config payload", 400);
  }

  const payload = configSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid config payload", 400);
  }

  const created = await createConfig({
    type: payload.data.type === "text" ? ConfigType.TEXT : ConfigType.IMAGE,
    providerName: payload.data.providerName,
    baseUrl: payload.data.baseURL,
    apiKey: payload.data.apiKey,
    models: payload.data.models
  });

  return Response.json(created, { status: 201 });
}
