import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { writeAtlasPdf } from "./report.js";
import type { CaptureRecord } from "./types.js";

test("atlas PDFs index the cover and every capture with valid outline targets", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-pdf-test-"));
  try {
    const image = path.join(root, "capture.png");
    const output = path.join(root, "atlas.pdf");
    await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 4,
        background: "#000000",
      },
    }).png().toFile(image);
    const capture = {
      key: "capture-key",
      route: "/faq",
      theme: "oled",
      viewport: "desktop-1440",
      state: "faq-search",
    } as CaptureRecord;
    const bookmarks = await writeAtlasPdf({
      outputFile: output,
      title: "KenMatch test atlas",
      subtitle: "Deterministic fixture",
      generatedAt: "2026-07-29T12:00:00.000Z",
      captures: [{ capture, imageFile: image, label: "/faq - anonymous" }],
    });
    assert.deepEqual(bookmarks.map((bookmark) => bookmark.page), [1, 2]);
    assert.deepEqual(bookmarks.map((bookmark) => bookmark.captureKey), [null, "capture-key"]);
    const pdf = fs.readFileSync(output).toString("latin1");
    assert.match(pdf, /\/Outlines/);
    assert.equal(pdf.match(/\/Dest\s*\[/g)?.length, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
