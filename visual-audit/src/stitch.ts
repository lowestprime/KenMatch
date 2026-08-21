import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { overlapPixels, overlappingPositions, TILE_OVERLAP_RATIO } from "./tiling.js";
import type { ScrollContainerRecord, TileRecord } from "./types.js";
import { ensureDirectory, relativePosix } from "./util.js";

export interface CapturedTile {
  file: string;
  position: number;
  width: number;
  height: number;
}

export function clientViewportCrop(input: {
  clientWidth: number;
  clientHeight: number;
  clientLeft: number;
  clientTop: number;
  rectWidth: number;
  rectHeight: number;
  imageWidth: number;
  imageHeight: number;
}) {
  const scaleX = input.rectWidth > 0 ? input.imageWidth / input.rectWidth : 1;
  const scaleY = input.rectHeight > 0 ? input.imageHeight / input.rectHeight : 1;
  const left = Math.min(input.imageWidth - 1, Math.max(0, Math.round(input.clientLeft * scaleX)));
  const top = Math.min(input.imageHeight - 1, Math.max(0, Math.round(input.clientTop * scaleY)));
  const width = Math.max(1, Math.min(input.imageWidth - left, Math.round(input.clientWidth * scaleX)));
  const height = Math.max(1, Math.min(input.imageHeight - top, Math.round(input.clientHeight * scaleY)));
  return { left, top, width, height };
}

export async function seamCorrelation(
  first: CapturedTile,
  second: CapturedTile,
  viewportCssHeight: number,
  deviceScaleFactor: number,
  edgeInsetCss: number,
) {
  const measuredScale = ((first.height / viewportCssHeight) + (second.height / viewportCssHeight)) / 2;
  const pixelScale = Number.isFinite(measuredScale) && measuredScale > 0
    ? measuredScale
    : deviceScaleFactor;
  const overlapCss = Math.max(0, first.position + viewportCssHeight - second.position);
  if (overlapCss <= 0) return 1;
  const overlap = Math.max(1, Math.min(first.height, second.height, Math.round(overlapCss * pixelScale)));
  const edgeInset = Math.min(
    Math.max(0, Math.round(edgeInsetCss * pixelScale)),
    Math.max(0, Math.floor((overlap - 1) / 2)),
  );
  const width = Math.min(first.width, second.width);
  const firstTop = Math.max(0, first.height - overlap + edgeInset);
  const secondTop = edgeInset;
  const height = Math.max(
    1,
    Math.min(overlap - edgeInset * 2, first.height - firstTop, second.height - secondTop),
  );
  const [firstRaw, secondRaw] = await Promise.all([
    sharp(first.file).extract({ left: 0, top: firstTop, width, height }).removeAlpha().raw().toBuffer(),
    sharp(second.file).extract({ left: 0, top: secondTop, width, height }).removeAlpha().raw().toBuffer(),
  ]);
  const length = Math.min(firstRaw.length, secondRaw.length);
  if (length === 0) return 0;
  let difference = 0;
  for (let index = 0; index < length; index += 1) {
    difference += Math.abs((firstRaw[index] ?? 0) - (secondRaw[index] ?? 0));
  }
  return Math.max(0, 1 - difference / (length * 255));
}

export async function stitchVerticalTiles(input: {
  tiles: CapturedTile[];
  sourceCssHeight: number;
  viewportCssHeight: number;
  deviceScaleFactor: number;
  seamEdgeInsetCss?: number;
  outputFile: string;
  runRoot: string;
}) {
  if (input.tiles.length === 0) throw new Error("Cannot stitch an empty tile collection.");
  ensureDirectory(path.dirname(input.outputFile));
  const measuredScales = input.tiles
    .map((tile) => tile.height / input.viewportCssHeight)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);
  const pixelScale = measuredScales.length
    ? measuredScales[Math.floor(measuredScales.length / 2)] ?? input.deviceScaleFactor
    : input.deviceScaleFactor;
  const width = Math.max(...input.tiles.map((tile) => tile.width));
  const height = Math.max(
    1,
    Math.min(
      Math.ceil(input.sourceCssHeight * pixelScale),
      Math.max(...input.tiles.map((tile) => Math.round(tile.position * pixelScale) + tile.height)),
    ),
  );
  const composites = input.tiles.map((tile) => ({
    input: tile.file,
    left: 0,
    top: Math.min(height - tile.height, Math.round(tile.position * pixelScale)),
  }));
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
    limitInputPixels: false,
  }).composite(composites).png({ compressionLevel: 9 }).toFile(input.outputFile);

  const seams: Array<{ first: string; second: string; score: number; passed: boolean }> = [];
  for (let index = 1; index < input.tiles.length; index += 1) {
    const first = input.tiles[index - 1];
    const second = input.tiles[index];
    if (!first || !second) continue;
    const score = await seamCorrelation(
      first,
      second,
      input.viewportCssHeight,
      input.deviceScaleFactor,
      input.seamEdgeInsetCss ?? 0,
    );
    seams.push({
      first: relativePosix(input.runRoot, first.file),
      second: relativePosix(input.runRoot, second.file),
      score,
      passed: score >= 0.88,
    });
  }
  return { width, height, seams };
}

export function tileRecords(
  tiles: CapturedTile[],
  runRoot: string,
  viewportCssWidth: number,
  viewportCssHeight: number,
): TileRecord[] {
  return tiles.map((tile) => ({
    file: relativePosix(runRoot, tile.file),
    x: 0,
    y: tile.position,
    width: viewportCssWidth,
    height: viewportCssHeight,
  }));
}

export async function captureScrollableElement(input: {
  element: import("playwright").Locator;
  selector: string;
  outputDirectory: string;
  outputFile: string;
  runRoot: string;
  deviceScaleFactor: number;
}): Promise<ScrollContainerRecord | null> {
  const dimensions = await input.element.evaluate((node) => ({
    width: node.clientWidth,
    height: node.clientHeight,
    scrollHeight: node.scrollHeight,
    clientLeft: node.clientLeft,
    clientTop: node.clientTop,
    rectWidth: node.getBoundingClientRect().width,
    rectHeight: node.getBoundingClientRect().height,
  })).catch(() => null);
  if (!dimensions || dimensions.height < 60 || dimensions.scrollHeight <= dimensions.height + 2) return null;
  const positions = overlappingPositions(dimensions.scrollHeight, dimensions.height);
  const tiles: CapturedTile[] = [];
  ensureDirectory(input.outputDirectory);
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index] ?? 0;
    await input.element.evaluate((node, top) => {
      node.scrollTop = top;
    }, position);
    const file = path.join(input.outputDirectory, `container-${String(index).padStart(4, "0")}.png`);
    await input.element.screenshot({ path: file, animations: "disabled" });
    let metadata = await sharp(file).metadata();
    const imageWidth = metadata.width ?? Math.ceil(dimensions.rectWidth * input.deviceScaleFactor);
    const imageHeight = metadata.height ?? Math.ceil(dimensions.rectHeight * input.deviceScaleFactor);
    const crop = clientViewportCrop({
      clientWidth: dimensions.width,
      clientHeight: dimensions.height,
      clientLeft: dimensions.clientLeft,
      clientTop: dimensions.clientTop,
      rectWidth: dimensions.rectWidth,
      rectHeight: dimensions.rectHeight,
      imageWidth,
      imageHeight,
    });
    if (
      crop.left !== 0
      || crop.top !== 0
      || crop.width !== imageWidth
      || crop.height !== imageHeight
    ) {
      const cropped = await sharp(file).extract(crop).png({ compressionLevel: 9 }).toBuffer();
      fs.writeFileSync(file, cropped);
      metadata = await sharp(file).metadata();
    }
    tiles.push({
      file,
      position,
      width: metadata.width ?? Math.ceil(dimensions.width * input.deviceScaleFactor),
      height: metadata.height ?? Math.ceil(dimensions.height * input.deviceScaleFactor),
    });
  }
  await input.element.evaluate((node) => {
    node.scrollTop = 0;
  });
  const stitched = await stitchVerticalTiles({
    tiles,
    sourceCssHeight: dimensions.scrollHeight,
    viewportCssHeight: dimensions.height,
    deviceScaleFactor: input.deviceScaleFactor,
    seamEdgeInsetCss: 1,
    outputFile: input.outputFile,
    runRoot: input.runRoot,
  });
  return {
    selector: input.selector,
    stitchedFile: relativePosix(input.runRoot, input.outputFile),
    sourceWidth: dimensions.width,
    sourceHeight: dimensions.scrollHeight,
    tiles: tileRecords(tiles, input.runRoot, dimensions.width, dimensions.height),
    seamCorrelations: stitched.seams,
  };
}

export { overlapPixels, overlappingPositions, TILE_OVERLAP_RATIO };
