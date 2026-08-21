import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sharp from "sharp";

import { clientViewportCrop, seamCorrelation, type CapturedTile } from "./stitch.js";

test("client viewport crop removes fixed borders from locator screenshots", () => {
  assert.deepEqual(clientViewportCrop({
    clientWidth: 345,
    clientHeight: 89,
    clientLeft: 1,
    clientTop: 1,
    rectWidth: 348,
    rectHeight: 92,
    imageWidth: 1044,
    imageHeight: 276,
  }), {
    left: 3,
    top: 3,
    width: 1035,
    height: 267,
  });
});

async function writeScrollTile(file: string, globalOffset: number) {
  const width = 16;
  const height = 100;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const edge = y < 4 || y >= height - 4;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      const value = edge ? 240 : (globalOffset + y) % 220;
      pixels[index] = value;
      pixels[index + 1] = edge ? 20 : (value * 3) % 220;
      pixels[index + 2] = edge ? 120 : (value * 7) % 220;
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 3 } }).png().toFile(file);
}

async function writeFractionalScaleTiles(firstFile: string, secondFile: string) {
  const width = 16;
  const viewportHeight = 341;
  const secondTop = 140;
  const sourceHeight = secondTop + viewportHeight;
  const pixels = Buffer.alloc(width * sourceHeight * 3);
  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      pixels[index] = y % 251;
      pixels[index + 1] = (y * 3) % 251;
      pixels[index + 2] = (y * 7) % 251;
    }
  }
  const source = sharp(pixels, { raw: { width, height: sourceHeight, channels: 3 } });
  await Promise.all([
    source.clone().extract({ left: 0, top: 0, width, height: viewportHeight }).png().toFile(firstFile),
    source.clone().extract({ left: 0, top: secondTop, width, height: viewportHeight }).png().toFile(secondFile),
  ]);
}

test("scroll seam correlation compares the same content after excluding fixed edges", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-scroll-seam-"));
  try {
    const firstFile = path.join(directory, "first.png");
    const secondFile = path.join(directory, "second.png");
    await Promise.all([
      writeScrollTile(firstFile, 0),
      writeScrollTile(secondFile, 40),
    ]);
    const first: CapturedTile = { file: firstFile, position: 0, width: 16, height: 100 };
    const second: CapturedTile = { file: secondFile, position: 40, width: 16, height: 100 };

    const score = await seamCorrelation(first, second, 100, 1, 4);

    assert.ok(score > 0.999, `expected aligned overlap, received ${score}`);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("scroll seam correlation derives Chromium's fractional CSS pixel scale", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-fractional-seam-"));
  try {
    const firstFile = path.join(directory, "first.png");
    const secondFile = path.join(directory, "second.png");
    await writeFractionalScaleTiles(firstFile, secondFile);
    const first: CapturedTile = { file: firstFile, position: 0, width: 16, height: 341 };
    const second: CapturedTile = { file: secondFile, position: 46, width: 16, height: 341 };

    const score = await seamCorrelation(first, second, 112, 3, 0);

    assert.ok(score > 0.999, `expected fractional-scale overlap, received ${score}`);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
