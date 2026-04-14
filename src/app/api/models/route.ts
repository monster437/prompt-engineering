import { listModelOptions } from "@/lib/configs";
import type { ModelsResponseDto } from "@/lib/types";

export async function GET() {
  const items = await listModelOptions();
  const response: ModelsResponseDto = { items };
  return Response.json(response);
}
