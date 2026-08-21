import { createHash } from "node:crypto";

export function hashPrivateIdentifier(value: string | null | undefined, purpose: string, salt: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  const digest = createHash("sha256")
    .update(`kenmatch:${purpose}\0${salt}\0${normalized}`)
    .digest("hex");
  return `sha256:${digest}`;
}
