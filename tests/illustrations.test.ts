import assert from "node:assert/strict";
import test from "node:test";

import { KEN_ILLUSTRATION_MAX_BYTES, validateKenIllustration } from "../src/lib/illustration-validation.ts";

const png1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
]);

test("Ken illustration validation accepts compact PNG uploads", () => {
  const result = validateKenIllustration({
    filename: "visual.png",
    mimeType: "image/png",
    sizeBytes: png1x1.length,
    bytes: png1x1,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.extension, "png");
    assert.equal(result.width, 1);
    assert.equal(result.height, 1);
  }
});

test("Ken illustration validation blocks SVG uploads", () => {
  const result = validateKenIllustration({
    filename: "unsafe.svg",
    mimeType: "image/svg+xml",
    sizeBytes: 80,
    bytes: new TextEncoder().encode("<svg><script>alert(1)</script></svg>"),
  });
  assert.equal(result.ok, false);
});

test("Ken illustration validation enforces file-size limit", () => {
  const result = validateKenIllustration({
    filename: "huge.png",
    mimeType: "image/png",
    sizeBytes: KEN_ILLUSTRATION_MAX_BYTES + 1,
    bytes: png1x1,
  });
  assert.equal(result.ok, false);
});
