import { ConfigType, ProviderConfig } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { maskApiKey } from "@/lib/security/mask";
import type {
  CreateProviderConfigRequest,
  ModelOptionDto,
  ProviderConfigDto,
  ProviderModel,
  UpdateProviderConfigRequest
} from "@/lib/types";

export function toConfigDto(config: Pick<ProviderConfig, "id" | "type" | "providerName" | "baseUrl" | "apiKey" | "modelsJson">): ProviderConfigDto {
  return {
    id: config.id,
    type: config.type === ConfigType.TEXT ? "text" : "image",
    providerName: config.providerName,
    baseURL: config.baseUrl,
    apiKeyMasked: maskApiKey(decryptSecret(config.apiKey)),
    models: JSON.parse(config.modelsJson) as ProviderModel[]
  };
}

export async function listConfigs() {
  const configs = await db.providerConfig.findMany({ orderBy: { createdAt: "asc" } });
  return configs.map(toConfigDto);
}

export async function listModelOptions(): Promise<ModelOptionDto[]> {
  const configs = await listConfigs();

  return configs.flatMap((config) =>
    config.models.map((model) => ({
      configId: config.id,
      configType: config.type,
      providerName: config.providerName,
      modelName: model.modelName,
      label: model.label,
      providerId: model.providerId
    }))
  );
}

export async function updateConfig(id: string, input: UpdateProviderConfigRequest) {
  const existing = await db.providerConfig.findUniqueOrThrow({ where: { id } });

  const updated = await db.providerConfig.update({
    where: { id },
    data: {
      type:
        input.type === undefined
          ? undefined
          : input.type === "text"
            ? ConfigType.TEXT
            : ConfigType.IMAGE,
      providerName: input.providerName,
      baseUrl: input.baseURL,
      apiKey: input.apiKey ? encryptSecret(input.apiKey) : undefined,
      modelsJson: input.models ? JSON.stringify(input.models) : undefined
    }
  });

  return toConfigDto({
    ...updated,
    apiKey: input.apiKey ? updated.apiKey : existing.apiKey
  });
}

export async function createConfig(input: CreateProviderConfigRequest & { type: ConfigType; baseUrl: string }) {
  const created = await db.providerConfig.create({
    data: {
      type: input.type,
      providerName: input.providerName,
      baseUrl: input.baseUrl,
      apiKey: encryptSecret(input.apiKey),
      modelsJson: JSON.stringify(input.models)
    }
  });

  return toConfigDto(created);
}
