/**
 * Deterministic Empty Room template thumbnail (shell-only plan diagram PNG).
 * Run: node scripts/catalog/generate-empty-room-thumbnail.mjs
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
const outPath = join(root, "public/catalog/templates/empty-room-v1.png");
const W = 640;
const H = 480;
const ROOM_W = 5200;
const ROOM_D = 4200;
const { toPx } = createPlanMapper(W, H, ROOM_W, ROOM_D);

function strokeRoom(pixels, x0, y0, x1, y1, color) {
  for (let t = 0; t < 4; t += 1) {
    fillRect(pixels, W, H, x0 - t, y0 - t, x1 + t, y0 + 1 - t, color);
    fillRect(pixels, W, H, x0 - t, y1 - 1 + t, x1 + t, y1 + t, color);
    fillRect(pixels, W, H, x0 - t, y0 - t, x0 + 1 - t, y1 + t, color);
    fillRect(pixels, W, H, x1 - 1 + t, y0 - t, x1 + t, y1 + t, color);
  }
}

/**
 * Cut door/window gaps using the same clockwise wall-start + offsetMm math as
 * createRectangularRoomShell (front: +x,+z → -x,+z; left: -x,+z → -x,-z).
 */
function cutOpenings(pixels, floor) {
  const hx = ROOM_W / 2;
  const hz = ROOM_D / 2;
  // Front door: offsetMm 650, widthMm 900 → x from 1950 → 1050 at z = +hz
  const [doorAx, doorAy] = toPx(hx - 650, hz);
  const [doorBx, doorBy] = toPx(hx - 650 - 900, hz);
  fillRect(
    pixels, W, H,
    Math.min(doorAx, doorBx), Math.min(doorAy, doorBy) - 3,
    Math.max(doorAx, doorBx), Math.max(doorAy, doorBy) + 3,
    floor,
  );
  // Left window: offsetMm 1100, widthMm 1600 → z from 1000 → -600 at x = -hx
  const [winAx, winAy] = toPx(-hx, hz - 1100);
  const [winBx, winBy] = toPx(-hx, hz - 1100 - 1600);
  fillRect(
    pixels, W, H,
    Math.min(winAx, winBx) - 3, Math.min(winAy, winBy),
    Math.max(winAx, winBx) + 3, Math.max(winAy, winBy),
    floor,
  );
}

export function generateEmptyRoomThumbnail() {
  const pixels = Buffer.alloc(W * H * 3, 0);
  const bg = [236, 232, 224];
  const floor = [222, 216, 204];
  const wall = [88, 96, 102];
  const frame = [62, 70, 76];
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
  cutOpenings(pixels, floor);
  const png = encodeRgbPng(pixels, W, H);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return { outPath, byteSize: png.length };
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = generateEmptyRoomThumbnail();
  console.log(`[catalog] wrote template thumbnail → ${result.outPath} (${result.byteSize} bytes)`);
}
