/**
 * Deterministic Living Room template thumbnail (plan diagram PNG).
 * Run: node scripts/catalog/generate-living-room-thumbnail.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = join(root, "public/catalog/templates/living-room-v1.png");
const W = 640;
const H = 480;
const ROOM_W = 5200;
const ROOM_D = 4200;
const SCALE = Math.min((W - 80) / ROOM_W, (H - 80) / ROOM_D);
const OX = (W - ROOM_W * SCALE) / 2;
const OY = (H - ROOM_D * SCALE) / 2;

function toPx(xMm, zMm) {
  return [
    Math.round(OX + (xMm + ROOM_W / 2) * SCALE),
    Math.round(OY + (ROOM_D / 2 - zMm) * SCALE),
  ];
}

function fillRect(pixels, x0, y0, x1, y1, color) {
  const left = Math.max(0, Math.min(x0, x1));
  const right = Math.min(W - 1, Math.max(x0, x1));
  const top = Math.max(0, Math.min(y0, y1));
  const bottom = Math.min(H - 1, Math.max(y0, y1));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const i = (y * W + x) * 3;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
    }
  }
}

function fillEllipse(pixels, cx, cy, r, color) {
  for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y += 1) {
    for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        const i = (y * W + x) * 3;
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

export function generateLivingRoomThumbnail() {
  const pixels = Buffer.alloc(W * H * 3, 0);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 232; pixels[i + 1] = 222; pixels[i + 2] = 208;
  }
  fillRect(pixels, 0, 0, W - 1, 7, [55, 72, 58]);
  fillRect(pixels, 0, H - 8, W - 1, H - 1, [55, 72, 58]);
  fillRect(pixels, 0, 0, 7, H - 1, [55, 72, 58]);
  fillRect(pixels, W - 8, 0, W - 1, H - 1, [55, 72, 58]);
  const [x0, y0] = toPx(-ROOM_W / 2, ROOM_D / 2);
  const [x1, y1] = toPx(ROOM_W / 2, -ROOM_D / 2);
  fillRect(pixels, x0, y0, x1, y1, [214, 204, 188]);
  for (let t = 0; t < 4; t += 1) {
    fillRect(pixels, x0 - t, y0 - t, x1 + t, y0 + 1 - t, [70, 90, 74]);
    fillRect(pixels, x0 - t, y1 - 1 + t, x1 + t, y1 + t, [70, 90, 74]);
    fillRect(pixels, x0 - t, y0 - t, x0 + 1 - t, y1 + t, [70, 90, 74]);
    fillRect(pixels, x1 - 1 + t, y0 - t, x1 + t, y1 + t, [70, 90, 74]);
  }
  for (const [cx, cz, w, d, color] of [
    [0, 150, 2000, 1400, [139, 115, 85]],
    [0, 1100, 2100, 900, [210, 195, 174]],
    [-1700, 200, 820, 860, [180, 170, 140]],
    [0, -50, 1200, 650, [169, 130, 98]],
    [0, -1650, 1600, 400, [150, 120, 90]],
    [0, -1650, 1200, 80, [30, 30, 34]],
  ]) {
    const [px, py] = toPx(cx, cz);
    const hw = Math.round((w * SCALE) / 2);
    const hd = Math.round((d * SCALE) / 2);
    fillRect(pixels, px - hw, py - hd, px + hw, py + hd, color);
  }
  for (const [cx, cz, r, color] of [
    [1900, -900, 18, [232, 226, 214]],
    [2100, 1300, 22, [63, 107, 58]],
  ]) {
    const [px, py] = toPx(cx, cz);
    fillEllipse(pixels, px, py, r, color);
  }
  const rows = [];
  for (let y = 0; y < H; y += 1) {
    rows.push(Buffer.from([0]), pixels.subarray(y * W * 3, (y + 1) * W * 3));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return { outPath, byteSize: png.length };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = generateLivingRoomThumbnail();
  console.log(`[catalog] wrote template thumbnail → ${result.outPath} (${result.byteSize} bytes)`);
}
