const AUDIT_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export const VISUAL_AUDIT_READONLY_HEADER = "x-kenmatch-audit-readonly";
export const VISUAL_AUDIT_TOKEN_HEADER = "x-kenmatch-audit-token";

function constantTimeStringEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isWellFormedVisualAuditToken(value: string | null | undefined): value is string {
  return typeof value === "string" && AUDIT_TOKEN_PATTERN.test(value);
}

export function isValidVisualAuditToken(
  candidate: string | null | undefined,
  expected = process.env.KENMATCH_AUDIT_TOKEN,
): boolean {
  if (!isWellFormedVisualAuditToken(candidate) || !isWellFormedVisualAuditToken(expected)) {
    return false;
  }
  return constantTimeStringEqual(candidate.toLowerCase(), expected.toLowerCase());
}

export function isValidatedVisualAuditContext(
  headers: Pick<Headers, "get">,
  expected = process.env.KENMATCH_AUDIT_TOKEN,
): boolean {
  return headers.get(VISUAL_AUDIT_READONLY_HEADER) === "1"
    && isValidVisualAuditToken(headers.get(VISUAL_AUDIT_TOKEN_HEADER), expected);
}
