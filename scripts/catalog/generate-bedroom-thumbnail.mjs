/**
 * Deterministic Bedroom template thumbnail (plan diagram PNG).
 * Run: node scripts/catalog/generate-bedroom-thumbnail.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createPlanMapper,
  encodeRgbPng,
  fillEllipse,
  fillRect,
} from "./lib/templateThumbnailPng.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = join(root, "public/catalog/templates/bedroom-v1.png");
const W = 640;
const H = 480;
const ROOM_W = 5200;
const ROOM_D = 4200;
const { scale, toPx } = createPlanMapper(W, H, ROOM_W, ROOM_D);

export function generateBedroomThumbnail() {
  const pixels = Buffer.alloc(W * H * 3, 0);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 232; pixels[i + 1] = 222; pixels[i + 2] = 208;
  }
  fillRect(pixels, W, H, 0, 0, W - 1, 7, [55, 72, 58]);
  fillRect(pixels, W, H, 0, H - 8, W - 1, H - 1, [55, 72, 58]);
  fillRect(pixels, W, H, 0, 0, 7, H - 1, [55, 72, 58]);
  fillRect(pixels, W, H, W - 8, 0, W - 1, H - 1, [55, 72, 58]);
  const [x0, y0] = toPx(-ROOM_W / 2, ROOM_D / 2);
  const [x1, y1] = toPx(ROOM_W / 2, -ROOM_D / 2);
  fillRect(pixels, W, H, x0, y0, x1, y1, [214, 204, 188]);
  for (let t = 0; t < 4; t += 1) {
    fillRect(pixels, W, H, x0 - t, y0 - t, x1 + t, y0 + 1 - t, [70, 90, 74]);
    fillRect(pixels, W, H, x0 - t, y1 - 1 + t, x1 + t, y1 + t, [70, 90, 74]);
    fillRect(pixels, W, H, x0 - t, y0 - t, x0 + 1 - t, y1 + t, [70, 90, 74]);
    fillRect(pixels, W, H, x1 - 1 + t, y0 - t, x1 + t, y1 + t, [70, 90, 74]);
  }
  for (const [cx, cz, w, d, color] of [
    [0, -200, 2000, 1400, [139, 115, 85]],
    [0, -900, 1600, 2100, [210, 195, 174]],
    [-1400, -1550, 450, 400, [169, 130, 98]],
    [1400, -1550, 450, 400, [169, 130, 98]],
    [2100, 400, 350, 800, [150, 120, 90]],
  ]) {
    const [px, py] = toPx(cx, cz);
    const hw = Math.round((w * scale) / 2);
    const hd = Math.round((d * scale) / 2);
    fillRect(pixels, W, H, px - hw, py - hd, px + hw, py + hd, color);
  }
  for (const [cx, cz, r, color] of [
    [1400, -1550, 14, [232, 226, 214]],
    [0, -1450, 16, [245, 242, 236]],
  ]) {
    const [px, py] = toPx(cx, cz);
    fillEllipse(pixels, W, H, px, py, r, color);
  }
  const png = encodeRgbPng(pixels, W, H);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return { outPath, byteSize: png.length };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = generateBedroomThumbnail();
  console.log(`[catalog] wrote template thumbnail → ${result.outPath} (${result.byteSize} bytes)`);
}
