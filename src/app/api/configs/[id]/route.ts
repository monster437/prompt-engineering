import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { updateConfig } from "@/lib/configs";
import { jsonError } from "@/lib/http/errors";
import { updateConfigSchema } from "@/lib/http/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid config payload", 400);
  }

  const payload = updateConfigSchema.safeParse(body);
  if (!payload.success) {
    return jsonError("Invalid config payload", 400);
  }

  try {
    const updated = await updateConfig(id, payload.data);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Config not found", 404);
    }

    throw error;
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await db.providerConfig.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError("Config not found", 404);
    }

    throw error;
  }
}
