import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import {
  getAdminNotificationSettings,
  recordAudit,
  recordVisitor,
} from "@/lib/db";
import { visitorHashSalt } from "@/lib/env";
import { buildVisitorNotificationEmail, sendMail } from "@/lib/mail";
import { isValidatedVisualAuditContext } from "@/lib/visual-audit-context";

export interface VisitorContext {
  visitorHash: string;
  countryCode: string | null;
  countryName: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  IE: "Ireland",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  FI: "Finland",
  DK: "Denmark",
  PL: "Poland",
  CZ: "Czech Republic",
  PT: "Portugal",
  GR: "Greece",
  IS: "Iceland",
  AU: "Australia",
  NZ: "New Zealand",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  ID: "Indonesia",
  PH: "Philippines",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  ZA: "South Africa",
  NG: "Nigeria",
  EG: "Egypt",
  KE: "Kenya",
  IL: "Israel",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  TR: "Turkey",
  RU: "Russia",
  UA: "Ukraine",
  RO: "Romania",
  HU: "Hungary",
  BG: "Bulgaria",
  RS: "Serbia",
  HR: "Croatia",
};

export async function extractVisitorContext(): Promise<VisitorContext | null> {
  const headerList = await headers();
  if (isValidatedVisualAuditContext(headerList)) {
    return null;
  }
  const ipAddress =
    headerList.get("cf-connecting-ip") ??
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;
  const countryCode = headerList.get("cf-ipcountry");
  const userAgent = headerList.get("user-agent");
  const hashSource = `${ipAddress ?? "unknown"}|${userAgent ?? "unknown"}`;
  const visitorHash = createHash("sha256")
    .update(`${visitorHashSalt}|${hashSource}`)
    .digest("hex");
  return {
    visitorHash,
    countryCode: countryCode && countryCode !== "XX" ? countryCode : null,
    countryName: countryCode && countryCode !== "XX" ? COUNTRY_NAMES[countryCode] ?? countryCode : null,
  };
}

export async function trackVisitor(context?: VisitorContext) {
  try {
    const resolved = context ?? (await extractVisitorContext());
    if (!resolved) {
      return { isNew: false, record: null };
    }
    const result = await recordVisitor({
      visitorHash: resolved.visitorHash,
      countryCode: resolved.countryCode,
      countryName: resolved.countryName,
    });
    if (result.isNew) {
      await recordAudit({
        accountId: null,
        action: "visitor.first-seen",
        detail: `Unique visitor observed${resolved.countryName ? ` from ${resolved.countryName}` : ""}.`,
        metadata: {
          country: resolved.countryName,
        },
      });
      await notifyAdminsNewVisitor(resolved);
    }
    return result;
  } catch (error) {
    console.warn("[visitor] tracking failed", error);
    return { isNew: false, record: null };
  }
}

async function notifyAdminsNewVisitor(context: VisitorContext) {
  try {
    const settings = await getAdminNotificationSettings();
    if (!settings.notifyOnFirstVisit) return;
    if (settings.recipientEmails.length === 0) return;
    const payload = buildVisitorNotificationEmail({
      country: context.countryName,
    });
    await sendMail({ to: settings.recipientEmails, ...payload });
  } catch (error) {
    console.warn("[visitor] notification failed", error);
  }
}
