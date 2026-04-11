import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey() {
  const encryptionKey = process.env.APP_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("APP_ENCRYPTION_KEY is required");
  }

  return createHash("sha256").update(encryptionKey).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(value: string) {
  const [ivHex, authTagHex, encryptedHex] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
