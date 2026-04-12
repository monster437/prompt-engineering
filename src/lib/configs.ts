import { ConfigType, ProviderConfig } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { maskApiKey } from "@/lib/security/mask";
import { ModelOptionDto, ProviderConfigDto, ProviderModel } from "@/lib/types";

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
  const configs = await db.providerConfig.findMany({
    select: {
      id: true,
      type: true,
      providerName: true,
      modelsJson: true
    },
    orderBy: { createdAt: "asc" }
  });

  return configs.flatMap((config) => {
    const models = JSON.parse(config.modelsJson) as ProviderModel[];

    return models.map((model) => ({
      configId: config.id,
      configType: config.type === ConfigType.TEXT ? "text" : "image",
      providerName: config.providerName,
      modelName: model.modelName,
      label: `${model.label} (${config.providerName})`,
      providerId: model.providerId
    }));
  });
}

export async function createConfig(input: {
  type: ConfigType;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  models: ProviderModel[];
}) {
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
