import { db } from "@/lib/db";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await db.providerConfig.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
