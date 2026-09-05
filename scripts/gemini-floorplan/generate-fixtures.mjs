/**
 * Generates simple synthetic floor-plan PNGs for the Gemini lab fixture pack.
 * Run: node scripts/gemini-floorplan/generate-fixtures.mjs
 */
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../public/experiments/gemini-floorplan/fixtures");
const docRoot = join(here, "../../experiments/gemini-floorplan/fixtures");
mkdirSync(root, { recursive: true });
mkdirSync(docRoot, { recursive: true });

function drawRectPlan(name, walls, label) {
  const w = 640;
  const h = 480;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of walls) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.fillStyle = "#444";
  ctx.font = "20px sans-serif";
  ctx.fillText(label, 24, 36);
  ctx.fillStyle = "#888";
  ctx.font = "14px sans-serif";
  ctx.fillText("Synthetic fixture — not a real job", 24, h - 20);
  writeFileSync(join(root, name), canvas.toBuffer("image/png"));
}

drawRectPlan(
  "rect-kitchen.png",
  [
    [80, 80, 560, 80],
    [560, 80, 560, 400],
    [560, 400, 80, 400],
    [80, 400, 80, 80],
  ],
  "Rect kitchen · ~3600×3000 mm",
);

drawRectPlan(
  "l-living.png",
  [
    [80, 80, 520, 80],
    [520, 80, 520, 280],
    [520, 280, 320, 280],
    [320, 280, 320, 400],
    [320, 400, 80, 400],
    [80, 400, 80, 80],
  ],
  "L living · scale unclear",
);

drawRectPlan(
  "two-room.png",
  [
    [60, 100, 300, 100],
    [300, 100, 300, 380],
    [300, 380, 60, 380],
    [60, 380, 60, 100],
    [300, 100, 580, 100],
    [580, 100, 580, 380],
    [580, 380, 300, 380],
  ],
  "Two-room · shared wall",
);

const notes = `# Fixture pack

Synthetic PNGs for Phase 1 demos (not customer plans).
Served from \`public/experiments/gemini-floorplan/fixtures/\`.

| File | Intent |
| --- | --- |
| rect-kitchen.png | Simple rectangle |
| l-living.png | L-shape / low scale confidence |
| two-room.png | Shared wall |

Offline JSON mirrors live in \`src/experiments/gemini-floorplan/sampleProposals.ts\`.

Regenerate: \`node scripts/gemini-floorplan/generate-fixtures.mjs\`
`;
writeFileSync(join(docRoot, "NOTES.md"), notes);
writeFileSync(join(root, "NOTES.md"), notes);

console.log("Wrote fixtures to", root);
