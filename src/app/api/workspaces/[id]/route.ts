import { db } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = await request.json();
  const updated = await db.workspace.update({ where: { id }, data: payload });
  return Response.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await db.workspace.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
