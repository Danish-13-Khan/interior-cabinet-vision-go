/**
 * Deterministic Bathroom template thumbnail (plan diagram PNG).
 * Run: node scripts/catalog/generate-bathroom-thumbnail.mjs
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
const outPath = join(root, "public/catalog/templates/bathroom-v1.png");
const W = 640;
const H = 480;
const ROOM_W = 4200;
const ROOM_D = 3600;
const { scale, toPx } = createPlanMapper(W, H, ROOM_W, ROOM_D);

export function generateBathroomThumbnail() {
  const pixels = Buffer.alloc(W * H * 3, 0);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = 214; pixels[i + 1] = 226; pixels[i + 2] = 228;
  }
  fillRect(pixels, W, H, 0, 0, W - 1, 7, [48, 78, 86]);
  fillRect(pixels, W, H, 0, H - 8, W - 1, H - 1, [48, 78, 86]);
  fillRect(pixels, W, H, 0, 0, 7, H - 1, [48, 78, 86]);
  fillRect(pixels, W, H, W - 8, 0, W - 1, H - 1, [48, 78, 86]);
  const [x0, y0] = toPx(-ROOM_W / 2, ROOM_D / 2);
  const [x1, y1] = toPx(ROOM_W / 2, -ROOM_D / 2);
  fillRect(pixels, W, H, x0, y0, x1, y1, [232, 238, 236]);
  for (let t = 0; t < 4; t += 1) {
    fillRect(pixels, W, H, x0 - t, y0 - t, x1 + t, y0 + 1 - t, [62, 98, 106]);
    fillRect(pixels, W, H, x0 - t, y1 - 1 + t, x1 + t, y1 + t, [62, 98, 106]);
    fillRect(pixels, W, H, x0 - t, y0 - t, x0 + 1 - t, y1 + t, [62, 98, 106]);
    fillRect(pixels, W, H, x1 - 1 + t, y0 - t, x1 + t, y1 + t, [62, 98, 106]);
  }
  for (const [cx, cz, w, d, color] of [
    [1530, -1230, 900, 900, [168, 196, 204]],
    [200, -1355, 400, 650, [236, 236, 232]],
    [-1400, -1455, 600, 450, [220, 224, 222]],
  ]) {
    const [px, py] = toPx(cx, cz);
    const hw = Math.round((w * scale) / 2);
    const hd = Math.round((d * scale) / 2);
    fillRect(pixels, W, H, px - hw, py - hd, px + hw, py + hd, color);
  }
  const [mx, my] = toPx(-1400, -1655);
  fillEllipse(pixels, W, H, mx, my, 10, [180, 198, 204]);
  const png = encodeRgbPng(pixels, W, H);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return { outPath, byteSize: png.length };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = generateBathroomThumbnail();
  console.log(`[catalog] wrote template thumbnail → ${result.outPath} (${result.byteSize} bytes)`);
}
