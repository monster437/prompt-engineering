import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http/errors";

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
