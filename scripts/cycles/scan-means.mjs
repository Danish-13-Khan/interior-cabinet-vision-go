/**
 * Precompute the linear mean of each scanned colour map and the mean of each
 * roughness map into `render-sources/materials/<id>/source.json`.
 *
 * The Blender material multiplies the raw scan by `styleColour / mean`, so the
 * still's albedo is the style colour with the scan as detail, the same rule the
 * viewport applies to its normalised KTX2 copies. Computing the means here keeps
 * the Python side free of colour-space guesswork.
 *
 *   node scripts/cycles/scan-means.mjs
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const materialsDir = join(root, "render-sources", "materials");
const SAMPLE = 256;

function srgbToLinear(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

async function pixels(path) {
  const image = await loadImage(path);
  const canvas = createCanvas(SAMPLE, SAMPLE);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, SAMPLE, SAMPLE);
  return context.getImageData(0, 0, SAMPLE, SAMPLE).data;
}

for (const id of readdirSync(materialsDir)) {
  const dir = join(materialsDir, id);
  const sourcePath = join(dir, "source.json");
  let source;
  try { source = JSON.parse(readFileSync(sourcePath, "utf8")); } catch { continue; }
  const color = await pixels(join(dir, "color.png"));
  const rough = await pixels(join(dir, "roughness.png"));
  const sum = [0, 0, 0];
  let roughSum = 0;
  const count = SAMPLE * SAMPLE;
  for (let i = 0; i < color.length; i += 4) {
    sum[0] += srgbToLinear(color[i]);
    sum[1] += srgbToLinear(color[i + 1]);
    sum[2] += srgbToLinear(color[i + 2]);
    roughSum += rough[i] / 255;
  }
  const next = {
    ...source,
    colorMeanLinear: sum.map((value) => Number((value / count).toFixed(4))),
    roughnessMean: Number((roughSum / count).toFixed(4)),
  };
  writeFileSync(sourcePath, `${JSON.stringify(next)}\n`);
  console.log(`${id.padEnd(30)} colour mean ${next.colorMeanLinear.join("/")} · roughness mean ${next.roughnessMean}`);
}
