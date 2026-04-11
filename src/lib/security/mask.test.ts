import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { maskApiKey } from "@/lib/security/mask";

const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY;

afterEach(() => {
  if (originalEncryptionKey === undefined) {
    delete process.env.APP_ENCRYPTION_KEY;
    return;
  }

  process.env.APP_ENCRYPTION_KEY = originalEncryptionKey;
});

describe("maskApiKey", () => {
  it("keeps only the suffix visible", () => {
    expect(maskApiKey("sk-1234567890abcd")).toBe("*************abcd");
  });
});

describe("encryptSecret and decryptSecret", () => {
  it("round-trips encrypted secrets", () => {
    process.env.APP_ENCRYPTION_KEY = "change-me-to-32-chars-minimum!!!";

    const encrypted = encryptSecret("super-secret");

    expect(decryptSecret(encrypted)).toBe("super-secret");
  });

  it("rejects tampered encrypted payloads", () => {
    process.env.APP_ENCRYPTION_KEY = "change-me-to-32-chars-minimum!!!";

    const encrypted = encryptSecret("super-secret");
    const [ivHex, authTagHex, encryptedHex] = encrypted.split(":");
    const tamperedAuthTagHex = `${authTagHex.slice(0, -1)}${authTagHex.endsWith("0") ? "1" : "0"}`;

    expect(() => decryptSecret(`${ivHex}:${tamperedAuthTagHex}:${encryptedHex}`)).toThrow();
  });

  it("throws when APP_ENCRYPTION_KEY is unset", () => {
    delete process.env.APP_ENCRYPTION_KEY;

    expect(() => encryptSecret("super-secret")).toThrow("APP_ENCRYPTION_KEY is required");
  });
});
