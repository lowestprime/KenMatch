import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";

const PREFIX = "v1";

function keyBuffer() {
  const raw = env.KENMATCH_CONFIG_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return createHash("sha256").update(raw).digest();
}

export function configEncryptionAvailable() {
  return Boolean(keyBuffer());
}

export function encryptConfigSecret(value: string) {
  const key = keyBuffer();
  if (!key) {
    throw new Error("KENMATCH_CONFIG_ENCRYPTION_KEY is required before SMTP passwords can be stored.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptConfigSecret(payload: string) {
  const key = keyBuffer();
  if (!key) {
    throw new Error("KENMATCH_CONFIG_ENCRYPTION_KEY is required before encrypted configuration can be read.");
  }
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== PREFIX || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Encrypted configuration payload is invalid.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
