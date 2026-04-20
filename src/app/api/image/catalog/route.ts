import { listImageCatalog } from "@/lib/configs";
import type { ImageCatalogResponseDto } from "@/lib/types";

export async function GET() {
  const response: ImageCatalogResponseDto = await listImageCatalog();
  return Response.json(response);
}
