/**
 * Deterministic Straight Kitchen template thumbnail (plan diagram PNG).
 * Run: node scripts/catalog/generate-straight-kitchen-thumbnail.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createPlanMapper,
  encodeRgbPng,
  fillRect,
} from "./lib/templateThumbnailPng.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = join(root, "public/catalog/templates/straight-kitchen-v1.png");
const W = 640;
const H = 480;
const ROOM_W = 6000;
const ROOM_D = 4000;
const { scale, toPx } = createPlanMapper(W, H, ROOM_W, ROOM_D);

function strokeRoom(pixels, x0, y0, x1, y1, color) {
  for (let t = 0; t < 4; t += 1) {
    fillRect(pixels, W, H, x0 - t, y0 - t, x1 + t, y0 + 1 - t, color);
    fillRect(pixels, W, H, x0 - t, y1 - 1 + t, x1 + t, y1 + t, color);
    fillRect(pixels, W, H, x0 - t, y0 - t, x0 + 1 - t, y1 + t, color);
    fillRect(pixels, W, H, x1 - 1 + t, y0 - t, x1 + t, y1 + t, color);
  }
}

function block(pixels, cx, cz, w, d, color) {
  const [px, py] = toPx(cx, cz);
  const hw = Math.round((w * scale) / 2);
  const hd = Math.round((d * scale) / 2);
  fillRect(pixels, W, H, px - hw, py - hd, px + hw, py + hd, color);
}

export function generateStraightKitchenThumbnail() {
  const pixels = Buffer.alloc(W * H * 3, 0);
  const bg = [230, 226, 220];
  const floor = [214, 208, 198];
  const wall = [72, 82, 90];
  const frame = [48, 56, 62];
  const cabinet = [168, 148, 122];
  const appliance = [120, 128, 136];
  const hood = [90, 96, 104];
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = bg[0]; pixels[i + 1] = bg[1]; pixels[i + 2] = bg[2];
  }
  fillRect(pixels, W, H, 0, 0, W - 1, 7, frame);
  fillRect(pixels, W, H, 0, H - 8, W - 1, H - 1, frame);
  fillRect(pixels, W, H, 0, 0, 7, H - 1, frame);
  fillRect(pixels, W, H, W - 8, 0, W - 1, H - 1, frame);
  const [x0, y0] = toPx(-ROOM_W / 2, ROOM_D / 2);
  const [x1, y1] = toPx(ROOM_W / 2, -ROOM_D / 2);
  fillRect(pixels, W, H, x0, y0, x1, y1, floor);
  strokeRoom(pixels, x0, y0, x1, y1, wall);
  // Floor run (tall + bases + drawer) + flanking appliances along the back wall
  for (const [cx, cz, w, d, color] of [
    [-2200, -1550, 700, 700, appliance],
    [-1350, -1620, 600, 560, cabinet],
    [-600, -1620, 900, 560, cabinet],
    [300, -1620, 900, 560, cabinet],
    [1200, -1620, 900, 560, cabinet],
    [2100, -1600, 600, 600, appliance],
    [2750, -1600, 800, 600, appliance],
    [2100, -1650, 600, 200, hood],
  ]) {
    block(pixels, cx, cz, w, d, color);
  }
  const png = encodeRgbPng(pixels, W, H);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return { outPath, byteSize: png.length };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = generateStraightKitchenThumbnail();
  console.log(`[catalog] wrote template thumbnail → ${result.outPath} (${result.byteSize} bytes)`);
}
