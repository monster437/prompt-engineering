import { ConfigType, ProviderConfig } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import {
  DEFAULT_IMAGE_ASPECT_RATIO,
  buildImageAspectRatioOptions,
  getImageSizeForAspectRatio
} from "@/lib/image-generation/catalog";
import { maskApiKey } from "@/lib/security/mask";
import { IMAGE_ASPECT_RATIOS } from "@/lib/types";
import type {
  CreateProviderConfigRequest,
  ImageCatalogResponseDto,
  ModelOptionDto,
  ProviderConfigDto,
  ProviderModel,
  UpdateProviderConfigRequest
} from "@/lib/types";

function normalizeProviderModels(models: ProviderModel[]) {
  const uniqueModels = new Map<string, ProviderModel>();

  for (const model of models) {
    const normalizedModelName = model.modelName.trim();
    const normalizedLabel = model.label.trim() || normalizedModelName;
    const normalizedProviderId = model.providerId?.trim() || undefined;
    const key = normalizedModelName.toLowerCase();

    if (!normalizedModelName || uniqueModels.has(key)) {
      continue;
    }

    uniqueModels.set(key, {
      modelName: normalizedModelName,
      label: normalizedLabel,
      ...(normalizedProviderId ? { providerId: normalizedProviderId } : {})
    });
  }

  return Array.from(uniqueModels.values());
}

export function toConfigDto(config: Pick<ProviderConfig, "id" | "type" | "providerName" | "baseUrl" | "apiKey" | "modelsJson">): ProviderConfigDto {
  return {
    id: config.id,
    type: config.type === ConfigType.TEXT ? "text" : "image",
    providerName: config.providerName,
    baseURL: config.baseUrl,
    apiKeyMasked: maskApiKey(decryptSecret(config.apiKey)),
    models: normalizeProviderModels(JSON.parse(config.modelsJson) as ProviderModel[])
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
    const models = normalizeProviderModels(JSON.parse(config.modelsJson) as ProviderModel[]);

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

export async function listImageCatalog(): Promise<ImageCatalogResponseDto> {
  const configs = await db.providerConfig.findMany({
    where: { type: ConfigType.IMAGE },
    select: {
      id: true,
      providerName: true,
      baseUrl: true,
      modelsJson: true
    },
    orderBy: { createdAt: "asc" }
  });

  const defaults = {
    aspectRatio: DEFAULT_IMAGE_ASPECT_RATIO,
    resolution: getImageSizeForAspectRatio(DEFAULT_IMAGE_ASPECT_RATIO)
  };

  return {
    defaults,
    aspectRatios: buildImageAspectRatioOptions(),
    providers: configs.map((config) => ({
      configId: config.id,
      providerName: config.providerName,
      baseURL: config.baseUrl,
      modelCount: normalizeProviderModels(JSON.parse(config.modelsJson) as ProviderModel[]).length
    })),
    items: configs.flatMap((config) =>
      normalizeProviderModels(JSON.parse(config.modelsJson) as ProviderModel[]).map((model) => ({
        configId: config.id,
        providerName: config.providerName,
        baseURL: config.baseUrl,
        modelName: model.modelName,
        label: model.label,
        ...(model.providerId ? { providerId: model.providerId } : {}),
        ability: "image" as const,
        supportedAspectRatios: Array.from(IMAGE_ASPECT_RATIOS),
        defaultAspectRatio: defaults.aspectRatio,
        defaultResolution: defaults.resolution
      }))
    )
  };
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
      modelsJson: input.models ? JSON.stringify(normalizeProviderModels(input.models)) : undefined
    }
  });

  return toConfigDto({
    ...updated,
    apiKey: input.apiKey ? updated.apiKey : existing.apiKey
  });
}

type CreateConfigInput = Omit<CreateProviderConfigRequest, "type" | "baseURL"> & {
  type: ConfigType;
  baseUrl: string;
};

export async function createConfig(input: CreateConfigInput) {
  const created = await db.providerConfig.create({
    data: {
      type: input.type,
      providerName: input.providerName,
      baseUrl: input.baseUrl,
      apiKey: encryptSecret(input.apiKey),
      modelsJson: JSON.stringify(normalizeProviderModels(input.models))
    }
  });

  return toConfigDto(created);
}
