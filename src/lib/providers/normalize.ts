import { NormalizedProviderResult } from "@/lib/prompting/contracts";

function isNormalizedProviderResult(value: unknown): value is NormalizedProviderResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as { status?: unknown; contextSnapshot?: unknown };
  return (
    (record.status === "completed" || record.status === "needs_clarification") &&
    !!record.contextSnapshot &&
    typeof record.contextSnapshot === "object"
  );
}

function stripMarkdownCodeFence(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function parseResult(text: string): NormalizedProviderResult | null {
  try {
    const parsed = JSON.parse(stripMarkdownCodeFence(text)) as unknown;
    return isNormalizedProviderResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function findNormalizedResult(value: unknown, seen = new Set<object>()): NormalizedProviderResult | null {
  if (typeof value === "string") {
    return parseResult(value);
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (isNormalizedProviderResult(value)) {
    return value;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findNormalizedResult(item, seen);
      if (result) {
        return result;
      }
    }
    return null;
  }

  for (const nestedValue of Object.values(value)) {
    const result = findNormalizedResult(nestedValue, seen);
    if (result) {
      return result;
    }
  }

  return null;
}

export function normalizeProviderResponse(payload: Record<string, any>): NormalizedProviderResult {
  const result = findNormalizedResult(payload);
  if (result) {
    return result;
  }

  throw new Error("Unsupported provider response shape");
}
