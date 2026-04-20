import { listModelOptions } from "@/lib/configs";
import { jsonError } from "@/lib/http/errors";
import type { ConfigKind, V1ModelDto, V1ModelsResponseDto } from "@/lib/types";

function parseAbilityFilter(request: Request): ConfigKind | undefined | null {
  const ability = new URL(request.url).searchParams.get("ability");

  if (!ability) {
    return undefined;
  }

  if (ability === "text" || ability === "image") {
    return ability;
  }

  return null;
}

export async function GET(request: Request) {
  const ability = parseAbilityFilter(request);
  if (ability === null) {
    return jsonError("Invalid ability filter", 400);
  }

  const items = await listModelOptions();
  const data: V1ModelDto[] = items
    .filter((item) => (ability ? item.configType === ability : true))
    .map((item) => ({
      id: item.modelName,
      object: "model" as const,
      created: 0,
      owned_by: item.providerName,
      provider_name: item.providerName,
      config_id: item.configId,
      config_type: item.configType,
      label: item.label,
      ability: item.configType,
      ...(item.providerId ? { provider_id: item.providerId } : {})
    }));

  const response: V1ModelsResponseDto = {
    object: "list",
    data
  };

  return Response.json(response);
}
