export function normalizeAuthority(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "";

  try {
    return new URL(`http://${raw}`).host.toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeHostname(value: string | null | undefined) {
  const authority = normalizeAuthority(value);
  if (!authority) return "";

  try {
    return new URL(`http://${authority}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeOrigin(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return "";
  }
}

export function trustedRequestOrigin(input: {
  authority: string;
  forwardedProto: string | null | undefined;
  publicOrigin?: string | null;
  production: boolean;
}) {
  const configuredOrigin = normalizeOrigin(input.publicOrigin);
  if (configuredOrigin) return configuredOrigin;

  const protocol = (input.forwardedProto ?? (input.production ? "https" : "http")).trim().toLowerCase();
  if (!input.authority || (protocol !== "http" && protocol !== "https")) return "";
  return `${protocol}://${input.authority}`;
}

export function trustedRouteOrigin(input: {
  forwardedHost?: string | null;
  host?: string | null;
  forwardedProto?: string | null;
  fallbackProtocol: string;
  publicOrigin?: string | null;
  production: boolean;
}) {
  return trustedRequestOrigin({
    authority: normalizeAuthority(input.forwardedHost ?? input.host),
    forwardedProto: input.forwardedProto ?? input.fallbackProtocol.replace(/:$/, ""),
    publicOrigin: input.publicOrigin,
    production: input.production,
  });
}
