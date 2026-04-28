export const KEN_ILLUSTRATION_MAX_BYTES = 1_500_000;

const ALLOWED_MIME = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type IllustrationValidation = {
  ok: true;
  mimeType: string;
  extension: string;
  width: number | null;
  height: number | null;
} | {
  ok: false;
  error: string;
};

function readPngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((value, index) => bytes[index] === value)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readGifDimensions(bytes: Uint8Array) {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function readJpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (length < 2) return null;
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }
  return null;
}

function readWebpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30) return null;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") return null;
  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === "VP8X" && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }
  return null;
}

function readDimensions(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/png") return readPngDimensions(bytes);
  if (mimeType === "image/jpeg") return readJpegDimensions(bytes);
  if (mimeType === "image/gif") return readGifDimensions(bytes);
  if (mimeType === "image/webp") return readWebpDimensions(bytes);
  return null;
}

export function validateKenIllustration(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
}): IllustrationValidation {
  const extension = ALLOWED_MIME.get(input.mimeType);
  if (!extension) {
    return { ok: false, error: "Upload a PNG, JPEG, WebP, or GIF image. SVG uploads are blocked." };
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > KEN_ILLUSTRATION_MAX_BYTES) {
    return { ok: false, error: "Illustrations must be under 1.5 MB." };
  }
  if (input.filename.toLowerCase().endsWith(".svg")) {
    return { ok: false, error: "SVG uploads are blocked unless sanitized by a future server-side pipeline." };
  }
  const dimensions = readDimensions(input.mimeType, input.bytes);
  if (dimensions && (dimensions.width > 4096 || dimensions.height > 4096)) {
    return { ok: false, error: "Illustrations must be 4096px or smaller on each side." };
  }
  return {
    ok: true,
    mimeType: input.mimeType,
    extension,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}
