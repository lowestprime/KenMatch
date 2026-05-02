import { z } from "zod";

export const CONTACT_OWNER_EMAIL = "owner@kmat.ch";

export const CONTACT_TOPICS = ["question", "suggestion", "bug", "partnership", "press", "other"] as const;

export const CONTACT_ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 6 * 1024 * 1024,
  allowedTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
  ],
} as const;

const allowedTypeSet = new Set<string>(CONTACT_ATTACHMENT_LIMITS.allowedTypes);

export const contactSchema = z.object({
  title: z.string().min(4, "Add a short title.").max(140),
  topic: z.enum(CONTACT_TOPICS),
  replyEmail: z.string().email("Enter a valid reply email."),
  bodyMarkdown: z.string().min(20, "Write at least a few specific sentences.").max(8000),
});

export function sanitizeContactAttachmentName(name: string | null | undefined) {
  return (name || "attachment").replace(/[^\w .()[\]-]+/g, "_").slice(0, 180);
}

export function validateContactAttachmentMeta(input: {
  name?: string | null;
  type?: string | null;
  size: number;
  nextTotalBytes: number;
}) {
  const mimeType = input.type || "application/octet-stream";
  const fileName = input.name || "Attachment";
  if (input.size > CONTACT_ATTACHMENT_LIMITS.maxFileBytes) {
    return `${fileName} is larger than 2 MB.`;
  }
  if (input.nextTotalBytes > CONTACT_ATTACHMENT_LIMITS.maxTotalBytes) {
    return "Attachments must be 6 MB or smaller in total.";
  }
  if (!allowedTypeSet.has(mimeType)) {
    return `${fileName} has an unsupported file type.`;
  }
  return null;
}
