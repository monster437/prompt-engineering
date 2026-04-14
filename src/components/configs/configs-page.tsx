"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  CreateProviderConfigRequest,
  ProviderConfigDto,
  UpdateProviderConfigRequest
} from "@/lib/types";
import { createConfig, deleteConfig, listConfigs, updateConfig } from "@/lib/config-client";

import { ConfigsShell } from "./configs-shell";
import type { ConfigFormValue } from "./config-form";

function createEmptyFormValue(): ConfigFormValue {
  return {
    type: "text",
    providerName: "",
    baseURL: "https://",
    apiKey: "",
    models: [{ modelName: "", label: "", providerId: "" }]
  };
}

function toFormValue(config: ProviderConfigDto): ConfigFormValue {
  return {
    type: config.type,
    providerName: config.providerName,
    baseURL: config.baseURL,
    apiKey: "",
    models: config.models.length > 0 ? config.models.map((model) => ({ ...model, providerId: model.providerId ?? "" })) : [{ modelName: "", label: "", providerId: "" }]
  };
}

export function ConfigsPage() {
  const [configs, setConfigs] = useState<ProviderConfigDto[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [formValue, setFormValue] = useState<ConfigFormValue>(createEmptyFormValue());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);

  useEffect(() => {
    void listConfigs().then((loadedConfigs) => {
      setConfigs(loadedConfigs);
      if (loadedConfigs[0]) {
        setActiveConfigId(loadedConfigs[0].id);
        setFormValue(toFormValue(loadedConfigs[0]));
      }
    });
  }, []);

  const activeConfig = useMemo(
    () => configs.find((config) => config.id === activeConfigId) ?? null,
    [configs, activeConfigId]
  );

  function handleCreateNew() {
    setActiveConfigId(null);
    setFormValue(createEmptyFormValue());
  }

  function handleSelectConfig(configId: string) {
    const selected = configs.find((config) => config.id === configId);
    if (!selected) return;
    setActiveConfigId(configId);
    setFormValue(toFormValue(selected));
  }

  async function handleDeleteConfig(configId: string) {
    setDeletingConfigId(configId);
    try {
      await deleteConfig(configId);
      const nextConfigs = configs.filter((config) => config.id !== configId);
      setConfigs(nextConfigs);
      if (activeConfigId === configId) {
        if (nextConfigs[0]) {
          setActiveConfigId(nextConfigs[0].id);
          setFormValue(toFormValue(nextConfigs[0]));
        } else {
          setActiveConfigId(null);
          setFormValue(createEmptyFormValue());
        }
      }
    } finally {
      setDeletingConfigId(null);
    }
  }

  async function handleSubmit() {
    setIsSaving(true);
    try {
      const sanitizedModels = formValue.models
        .map((model) => ({
          modelName: model.modelName.trim(),
          label: model.label.trim(),
          ...(model.providerId?.trim() ? { providerId: model.providerId.trim() } : {})
        }))
        .filter((model) => model.modelName && model.label);

      if (activeConfig) {
        const payload: UpdateProviderConfigRequest = {
          type: formValue.type,
          providerName: formValue.providerName.trim(),
          baseURL: formValue.baseURL.trim(),
          models: sanitizedModels,
          ...(formValue.apiKey.trim() ? { apiKey: formValue.apiKey.trim() } : {})
        };
        const updated = await updateConfig(activeConfig.id, payload);
        setConfigs((current) => current.map((config) => (config.id === updated.id ? updated : config)));
        setFormValue(toFormValue(updated));
      } else {
        const payload: CreateProviderConfigRequest = {
          type: formValue.type,
          providerName: formValue.providerName.trim(),
          baseURL: formValue.baseURL.trim(),
          apiKey: formValue.apiKey.trim(),
          models: sanitizedModels
        };
        const created = await createConfig(payload);
        setConfigs((current) => [...current, created]);
        setActiveConfigId(created.id);
        setFormValue(toFormValue(created));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ConfigsShell
      configs={configs}
      activeConfigId={activeConfigId}
      deletingConfigId={deletingConfigId}
      formValue={formValue}
      apiKeyMasked={activeConfig?.apiKeyMasked ?? null}
      isEditing={Boolean(activeConfig)}
      isSaving={isSaving}
      onCreateNew={handleCreateNew}
      onSelectConfig={handleSelectConfig}
      onDeleteConfig={handleDeleteConfig}
      onFormChange={setFormValue}
      onSubmit={handleSubmit}
    />
  );
}
