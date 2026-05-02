import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTACT_ATTACHMENT_LIMITS,
  CONTACT_OWNER_EMAIL,
  contactSchema,
  sanitizeContactAttachmentName,
  validateContactAttachmentMeta,
} from "../src/lib/contact.ts";
import { FAQ_ENTRIES, KEN_DEFINITION } from "../src/lib/faq.ts";

test("FAQ includes a direct Ken definition entry", () => {
  const entry = FAQ_ENTRIES.find((item) => item.id === "what-is-a-ken");
  assert.ok(entry);
  assert.ok(entry.answer.includes(KEN_DEFINITION));
  assert.ok(FAQ_ENTRIES.some((item) => item.keywords.includes("sponsor")));
});

test("contact schema accepts complete feedback and rejects short bodies", () => {
  const valid = contactSchema.safeParse({
    title: "Partnership question",
    topic: "partnership",
    replyEmail: "reader@example.com",
    bodyMarkdown: "This is a specific partnership question with enough detail.",
  });
  assert.equal(valid.success, true);

  const invalid = contactSchema.safeParse({
    title: "Bad",
    topic: "question",
    replyEmail: "not-an-email",
    bodyMarkdown: "Too short",
  });
  assert.equal(invalid.success, false);
});

test("contact attachment validation enforces size and type limits", () => {
  assert.equal(
    validateContactAttachmentMeta({
      name: "note.md",
      type: "text/markdown",
      size: 100,
      nextTotalBytes: 100,
    }),
    null,
  );
  assert.match(
    validateContactAttachmentMeta({
      name: "archive.exe",
      type: "application/x-msdownload",
      size: 100,
      nextTotalBytes: 100,
    }) ?? "",
    /unsupported/i,
  );
  assert.match(
    validateContactAttachmentMeta({
      name: "large.pdf",
      type: "application/pdf",
      size: CONTACT_ATTACHMENT_LIMITS.maxFileBytes + 1,
      nextTotalBytes: CONTACT_ATTACHMENT_LIMITS.maxFileBytes + 1,
    }) ?? "",
    /larger than 2 MB/i,
  );
});

test("contact helper exposes anonymized owner fallback and safe filenames", () => {
  assert.equal(CONTACT_OWNER_EMAIL, "owner@kmat.ch");
  assert.equal(sanitizeContactAttachmentName("../bad<script>.png"), ".._bad_script_.png");
});
