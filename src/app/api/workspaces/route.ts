import { createWorkspace, listWorkspaces } from "@/lib/workspaces";

export async function GET() {
  return Response.json(await listWorkspaces());
}

export async function POST(request: Request) {
  const { title } = (await request.json()) as { title?: string };
  const workspace = await createWorkspace(title?.trim() || "工作台");
  return Response.json(workspace, { status: 201 });
}
