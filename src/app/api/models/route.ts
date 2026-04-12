import { listModelOptions } from "@/lib/configs";
import { ModelsResponseDto } from "@/lib/types";

export async function GET() {
  const items = await listModelOptions();
  const response: ModelsResponseDto = { items };

  return Response.json(response);
}
