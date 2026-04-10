import { db } from "@/lib/db";
import { toWorkspaceDto, toWorkspaceUpdateData } from "@/lib/workspaces";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Record<string, unknown>;
  const updated = await db.workspace.update({ where: { id }, data: toWorkspaceUpdateData(payload) });
  return Response.json(toWorkspaceDto(updated));
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await db.workspace.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
