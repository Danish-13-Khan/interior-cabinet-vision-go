/**
 * Writes compact equirectangular Radiance HDR placeholders for lighting recipes.
 * Run: node scripts/generate-environment-hdris.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "environments");
const WIDTH = 128;
const HEIGHT = 64;

function floatToRgbe(r, g, b) {
  const v = Math.max(r, g, b);
  if (v < 1e-32) return [0, 0, 0, 0];
  const exponent = Math.floor(Math.log2(v)) + 1;
  const scale = Math.pow(2, exponent) / 256;
  return [
    Math.min(255, Math.round(r / scale)),
    Math.min(255, Math.round(g / scale)),
    Math.min(255, Math.round(b / scale)),
    exponent + 128,
  ];
}

function sampleDaylight(u, v) {
  const elev = 1 - v;
  const sun = Math.exp(-Math.pow((u - 0.72) * 8, 2) - Math.pow((elev - 0.62) * 10, 2));
  const sky = 0.35 + elev * 0.9;
  return [
    sky * 0.75 + sun * 4.5,
    sky * 0.88 + sun * 4.2,
    sky * 1.15 + sun * 3.4,
  ];
}

function sampleWarmEvening(u, v) {
  const elev = 1 - v;
  const sun = Math.exp(-Math.pow((u - 0.18) * 7, 2) - Math.pow((elev - 0.28) * 9, 2));
  const glow = Math.max(0, 0.55 - elev) * 1.4;
  return [
    0.55 + glow * 1.6 + sun * 5.5,
    0.28 + glow * 0.7 + sun * 2.4,
    0.12 + sun * 0.8,
  ];
}

function sampleNeutralStudio(u, v) {
  const elev = 1 - v;
  const soft = 0.55 + elev * 0.65;
  const panel = Math.exp(-Math.pow((u - 0.5) * 3.2, 2) - Math.pow((elev - 0.78) * 4.5, 2));
  return [
    soft * 1.05 + panel * 2.2,
    soft * 1.02 + panel * 2.1,
    soft * 0.98 + panel * 1.9,
  ];
}

function writeHdr(fileName, sampler) {
  const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${HEIGHT} +X ${WIDTH}\n`;
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);
  let offset = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const [r, g, b] = sampler((x + 0.5) / WIDTH, (y + 0.5) / HEIGHT);
      const rgbe = floatToRgbe(r, g, b);
      pixels[offset++] = rgbe[0];
      pixels[offset++] = rgbe[1];
      pixels[offset++] = rgbe[2];
      pixels[offset++] = rgbe[3];
    }
  }
  writeFileSync(join(outDir, fileName), Buffer.concat([Buffer.from(header, "ascii"), pixels]));
}

mkdirSync(outDir, { recursive: true });
writeHdr("daylight.hdr", sampleDaylight);
writeHdr("warm-evening.hdr", sampleWarmEvening);
writeHdr("neutral-studio.hdr", sampleNeutralStudio);
console.log(`Wrote HDR placeholders to ${outDir}`);
