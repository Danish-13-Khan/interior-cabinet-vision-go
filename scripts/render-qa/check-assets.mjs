#!/usr/bin/env node
/**
 * Verify curated GLB / HDRI / PBR files exist for available registry entries.
 * Prints asset-resolution warnings; exits 1 only when an available asset file is missing.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const publicRoot = join(root, "public");

const EXPECTED_GLBS = [
  "models/soft-goods/sofa-3-seat.glb",
  "models/soft-goods/lounge-chair.glb",
  "models/soft-goods/coffee-table.glb",
  "models/soft-goods/side-table.glb",
  "models/soft-goods/floor-lamp.glb",
  "models/soft-goods/indoor-plant.glb",
];

const EXPECTED_TEXTURES = [
  "textures/wood/oak-color.ktx2",
  "textures/wood/oak-normal.ktx2",
  "textures/wood/oak-rough.ktx2",
  "textures/wood/walnut-color.ktx2",
  "textures/wood/walnut-normal.ktx2",
  "textures/wood/walnut-rough.ktx2",
  "textures/fabric/oatmeal-color.ktx2",
  "textures/fabric/oatmeal-normal.ktx2",
  "textures/fabric/oatmeal-rough.ktx2",
  "textures/fabric/olive-color.ktx2",
  "textures/fabric/olive-normal.ktx2",
  "textures/fabric/olive-rough.ktx2",
  "textures/paint/wall-color.ktx2",
  "textures/paint/wall-normal.ktx2",
  "textures/paint/wall-rough.ktx2",
  "textures/stone/warm-color.ktx2",
  "textures/stone/warm-normal.ktx2",
  "textures/stone/warm-rough.ktx2",
  "textures/laminate/white-color.ktx2",
  "textures/laminate/white-normal.ktx2",
  "textures/laminate/white-rough.ktx2",
  "textures/laminate/grey-color.ktx2",
  "textures/laminate/grey-normal.ktx2",
  "textures/laminate/grey-rough.ktx2",
  "textures/metal/charcoal-ao.png",
  "basis/basis_transcoder.js",
  "basis/basis_transcoder.wasm",
];

const EXPECTED_HDRIS = [
  "environments/daylight.hdr",
  "environments/warm-evening.hdr",
  "environments/neutral-studio.hdr",
];

function checkList(label, keys) {
  const missing = [];
  const present = [];
  for (const key of keys) {
    const path = join(publicRoot, key);
    if (existsSync(path)) present.push(key);
    else missing.push(key);
  }
  console.log(`[render-qa] ${label}: ${present.length}/${keys.length} present`);
  for (const key of missing) {
    console.warn(`[render-qa] missing ${label}: ${key}`);
  }
  return missing;
}

function listDir(rel) {
  const path = join(publicRoot, rel);
  if (!existsSync(path)) return [];
  return readdirSync(path).map((name) => `${rel}/${name}`);
}

const missing = [
  ...checkList("GLB", EXPECTED_GLBS),
  ...checkList("PBR", EXPECTED_TEXTURES),
  ...checkList("HDRI", EXPECTED_HDRIS),
];

const extrasHint = [
  ...listDir("models/soft-goods").filter((key) => !EXPECTED_GLBS.includes(key)),
].slice(0, 8);
if (extrasHint.length) {
  console.log(`[render-qa] additional soft-goods files: ${extrasHint.join(", ")}`);
}

if (missing.length) {
  console.error(`[render-qa] ${missing.length} required asset file(s) missing`);
  process.exit(1);
}

console.log("[render-qa] asset resolution OK");
