import { jsonError } from "@/lib/http/errors";
import {
  createReverseWorkspace,
  listReverseWorkspaces
} from "@/lib/reverse-workspaces";

export async function GET() {
  return Response.json(await listReverseWorkspaces());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid reverse workspace payload", 400);
  }

  const { title } = (body ?? {}) as { title?: unknown };
  const workspace = await createReverseWorkspace(
    typeof title === "string" && title.trim() ? title.trim() : "逆推工作台"
  );

  return Response.json(workspace, { status: 201 });
}
