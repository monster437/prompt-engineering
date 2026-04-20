import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { jsonError } from "@/lib/http/errors";
import {
  toReverseWorkspaceDto,
  toReverseWorkspaceUpdateData
} from "@/lib/reverse-workspaces";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid reverse workspace payload", 400);
  }

  try {
    const updated = await db.reverseWorkspace.update({
      where: { id },
      data: toReverseWorkspaceUpdateData(payload)
    });

    return Response.json(toReverseWorkspaceDto(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Reverse workspace not found", 404);
    }

    throw error;
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    await db.reverseWorkspace.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return jsonError("Reverse workspace not found", 404);
    }

    throw error;
  }
}
