import "server-only";

import nodemailer from "nodemailer";

import { getEffectiveSmtpConfig, recordAdminSmtpTest } from "@/lib/db";

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = "";
let cachedWarnedNoSmtp = false;

async function getTransporter(): Promise<{ transporter: nodemailer.Transporter; from: string; source: "env" | "database" } | null> {
  const config = await getEffectiveSmtpConfig();
  if (!config) return null;
  const key = `${config.source}:${config.host}:${config.port}:${config.secure}:${config.username}:${config.from}`;
  if (!cachedTransporter || cachedTransporterKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
    cachedTransporterKey = key;
  }
  return { transporter: cachedTransporter, from: config.from, source: config.source };
}

export interface MailPayload {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export async function sendMail(payload: MailPayload): Promise<{ ok: boolean; info?: unknown; error?: string }> {
  const transport = await getTransporter();
  if (!transport) {
    if (!cachedWarnedNoSmtp) {
      console.warn(`[mail] SMTP not configured. Skipping outbound email "${payload.subject}".`);
      cachedWarnedNoSmtp = true;
    }
    return { ok: false, error: "SMTP not configured" };
  }
  try {
    const info = await transport.transporter.sendMail({
      from: transport.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo,
    });
    return { ok: true, info };
  } catch (error) {
    console.error("[mail] send failed", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendSmtpTestMail(input: { to: string; actorId: string | null }) {
  const transport = await getTransporter();
  if (!transport) {
    await recordAdminSmtpTest("error", "SMTP is not configured.", input.actorId);
    return { ok: false, error: "SMTP is not configured." };
  }
  try {
    await transport.transporter.verify();
    const info = await transport.transporter.sendMail({
      from: transport.from,
      to: input.to,
      subject: "KenMatch SMTP test",
      text: "KenMatch SMTP validation succeeded. This test confirms only that the configured server accepted a message.",
    });
    await recordAdminSmtpTest("success", `Test email accepted by ${transport.source} SMTP.`, input.actorId);
    return { ok: true, info };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordAdminSmtpTest("error", message, input.actorId);
    return { ok: false, error: message };
  }
}

export function buildVerificationEmail(input: { name: string; url: string }) {
  const { name, url } = input;
  const subject = "Verify your KenMatch account";
  const text = `Hi ${name},\n\nPlease confirm your email address to finish activating your KenMatch account:\n\n${url}\n\nIf you didn't sign up, you can safely ignore this message.\n\n— KenMatch`;
  const html = `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0c1020;padding:32px;color:#e7edf5">
    <div style="max-width:520px;margin:0 auto;background:#10152a;border-radius:16px;padding:28px;border:1px solid #1f2744">
    <h2 style="margin:0 0 16px;font-size:22px">Confirm your email</h2>
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for signing up. Please confirm your email address to finish activating your KenMatch account.</p>
    <p style="margin:24px 0;text-align:center"><a href="${url}" style="display:inline-block;background:linear-gradient(120deg,#18b6a4,#4f8dff,#ff8f49);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Confirm my email</a></p>
    <p style="color:#8b93a8;font-size:13px">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${escapeHtml(url)}</span></p>
    <p style="color:#8b93a8;font-size:13px;margin-top:24px">This link expires in 48 hours. If you didn't sign up, you can safely ignore this message.</p>
    </div></body></html>`;
  return { subject, text, html };
}

export function buildPasswordResetEmail(input: { name: string; url: string }) {
  const { name, url } = input;
  const subject = "Reset your KenMatch password";
  const text = `Hi ${name},\n\nWe received a request to reset your KenMatch password. Click the link below to set a new one:\n\n${url}\n\nThis link expires in 30 minutes. If you didn't request a reset, you can safely ignore this message.\n\n— KenMatch`;
  const html = `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0c1020;padding:32px;color:#e7edf5">
    <div style="max-width:520px;margin:0 auto;background:#10152a;border-radius:16px;padding:28px;border:1px solid #1f2744">
    <h2 style="margin:0 0 16px;font-size:22px">Reset your password</h2>
    <p>Hi ${escapeHtml(name)},</p>
    <p>We received a request to reset your KenMatch password. Click the button below to set a new one:</p>
    <p style="margin:24px 0;text-align:center"><a href="${url}" style="display:inline-block;background:linear-gradient(120deg,#18b6a4,#4f8dff,#ff8f49);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Set new password</a></p>
    <p style="color:#8b93a8;font-size:13px">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${escapeHtml(url)}</span></p>
    <p style="color:#8b93a8;font-size:13px;margin-top:24px">This link expires in 30 minutes. If you didn't request a reset, you can ignore this message.</p>
    </div></body></html>`;
  return { subject, text, html };
}

export function buildSignupNotificationEmail(input: {
  accountEmail: string;
  name: string;
  role: string;
  specialty: string;
  ipAddress?: string | null;
  country?: string | null;
}) {
  const subject = `[KenMatch] New account: ${input.name}`;
  const text = [
    `A new account was created on KenMatch.`,
    ``,
    `Email: ${input.accountEmail}`,
    `Name: ${input.name}`,
    `Role: ${input.role}`,
    `Specialty: ${input.specialty}`,
    input.ipAddress ? `IP: ${input.ipAddress}` : null,
    input.country ? `Country: ${input.country}` : null,
  ].filter(Boolean).join("\n");
  return { subject, text };
}

export function buildVisitorNotificationEmail(input: {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
}) {
  const location = [input.city, input.region, input.country].filter(Boolean).join(", ");
  const subject = `[KenMatch] New visitor${location ? ` from ${location}` : ""}`;
  const text = [
    `A new unique visitor accessed KenMatch.`,
    location ? `Location: ${location}` : null,
    input.userAgent ? `Agent: ${input.userAgent}` : null,
  ].filter(Boolean).join("\n");
  return { subject, text };
}

export function buildVerificationRequestEmail(input: { name: string; note: string; profileUrl: string }) {
  const subject = `[KenMatch] Verification requested: ${input.name}`;
  const text = [
    `${input.name} requested account verification.`,
    ``,
    `Note from contributor:`,
    input.note || "(no note)",
    ``,
    `Review: ${input.profileUrl}`,
  ].join("\n");
  return { subject, text };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
