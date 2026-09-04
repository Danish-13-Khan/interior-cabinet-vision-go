/**
 * Minimal RGB PNG helpers for deterministic catalog template thumbnails.
 */
import { deflateSync } from "node:zlib";

export function fillRect(pixels, width, height, x0, y0, x1, y1, color) {
  const left = Math.max(0, Math.min(x0, x1));
  const right = Math.min(width - 1, Math.max(x0, x1));
  const top = Math.max(0, Math.min(y0, y1));
  const bottom = Math.min(height - 1, Math.max(y0, y1));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const i = (y * width + x) * 3;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
    }
  }
}

export function fillEllipse(pixels, width, height, cx, cy, r, color) {
  for (let y = Math.max(0, cy - r); y <= Math.min(height - 1, cy + r); y += 1) {
    for (let x = Math.max(0, cx - r); x <= Math.min(width - 1, cx + r); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        const i = (y * width + x) * 3;
        pixels[i] = color[0];
        pixels[i + 1] = color[1];
        pixels[i + 2] = color[2];
      }
    }
  }
}

function pngChunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag), data]);
  let c = ~0;
  for (let i = 0; i < body.length; i += 1) {
    c ^= body[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(~c >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function encodeRgbPng(pixels, width, height) {
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(Buffer.from([0]), pixels.subarray(y * width * 3, (y + 1) * width * 3));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Map room-centered mm (x right, z forward) into pixel coords for a plan diagram. */
export function createPlanMapper(widthPx, heightPx, roomWMm, roomDMm, padPx = 80) {
  const scale = Math.min((widthPx - padPx) / roomWMm, (heightPx - padPx) / roomDMm);
  const ox = (widthPx - roomWMm * scale) / 2;
  const oy = (heightPx - roomDMm * scale) / 2;
  return {
    scale,
    toPx(xMm, zMm) {
      return [
        Math.round(ox + (xMm + roomWMm / 2) * scale),
        Math.round(oy + (roomDMm / 2 - zMm) * scale),
      ];
    },
  };
}
