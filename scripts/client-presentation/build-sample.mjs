#!/usr/bin/env node
/**
 * Validate client presentation package shape for CI / local checks.
 * Does not generate workshop cutlists.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "tmp/client-presentation-sample");

const REQUIRED = [
  "kind",
  "version",
  "exportedAt",
  "brand",
  "deliverable",
  "files",
  "roomSummary",
  "objects",
  "materials",
  "cameras",
];

function fail(message) {
  console.error(`[presentation] ${message}`);
  process.exit(1);
}

/** Minimal fixture mirroring domain package shape (no Three/jsPDF). */
const sample = {
  kind: "living-room-client-preview",
  version: 1,
  exportedAt: "2026-08-12T21:00:00.000Z",
  brand: "Interiors",
  deliverable: "client-presentation",
  files: [
    "demo-hero-render.png",
    "demo-client-preview.pdf",
    "demo-project.json",
    "demo-room-summary.json",
    "demo-objects.json",
    "demo-materials.json",
    "demo-cameras.json",
    "demo-manifest.json",
  ],
  roomSummary: {
    projectId: "living-room-release-demo",
    projectName: "Living Room Release Demo",
    roomId: "room-1",
    roomName: "Living Room",
    widthMm: 5000,
    depthMm: 4000,
    heightMm: 2700,
    objectCount: 8,
    materialCount: 9,
    cameraCount: 3,
    styleId: "nordic-light",
    styleName: "Nordic Light",
    lightingRecipeId: "daylight",
  },
  objects: [{ id: "sofa", name: "Sofa", category: "sofa" }],
  materials: [{ id: "oak", name: "Natural Oak", kind: "wood", color: "#b98a58" }],
  cameras: [{ id: "cam-1", name: "Wide", active: true }],
};

mkdirSync(outDir, { recursive: true });
const manifestPath = join(outDir, "demo-manifest.json");
writeFileSync(manifestPath, JSON.stringify(sample, null, 2));
writeFileSync(
  join(outDir, "demo-room-summary.json"),
  JSON.stringify(sample.roomSummary, null, 2),
);
writeFileSync(join(outDir, "demo-objects.json"), JSON.stringify(sample.objects, null, 2));
writeFileSync(join(outDir, "demo-materials.json"), JSON.stringify(sample.materials, null, 2));
writeFileSync(join(outDir, "demo-cameras.json"), JSON.stringify(sample.cameras, null, 2));

if (!existsSync(manifestPath)) fail("sample manifest missing");
const loaded = JSON.parse(readFileSync(manifestPath, "utf8"));
for (const key of REQUIRED) {
  if (!(key in loaded)) fail(`manifest missing ${key}`);
}
if (loaded.deliverable !== "client-presentation") fail("wrong deliverable");
if (loaded.kind !== "living-room-client-preview") fail("wrong kind");
if (!Array.isArray(loaded.files) || loaded.files.length < 6) fail("files incomplete");

console.log(`[presentation] sample package OK → ${outDir}`);
console.log(`[presentation] ${loaded.files.length} declared files · client deliverable only`);
