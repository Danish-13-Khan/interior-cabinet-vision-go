/**
 * Pixel bands for wall, floor, and the darker door half.
 * Centers come from a `--record-bands` run. 231/255 is not a pass value.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { readStillSurfacesFromPage } from "./stillCaptureQuality.mjs";

export const SURFACE_BANDS_FILE = "fixtures/photo-stills/surface-bands.json";
const DEFAULT_TOLERANCE = 12;
const MIN_HITS = 3;

const recorded = new Map();

export function surfaceKindsForLabel(label) {
  const plan = label.includes("plan") || label.includes("overview");
  return plan ? ["wall", "floor"] : ["wall", "floor", "door"];
}

export async function loadSurfaceBands(root) {
  try {
    const text = await readFile(join(root, SURFACE_BANDS_FILE), "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatSurfaces(reading) {
  const part = (kind) => {
    const sample = reading[kind];
    const count = reading.counts?.[kind] ?? 0;
    if (!sample) return `${kind} — (${count})`;
    return `${kind} ${sample.luma.toFixed(0)} RGB ${sample.r.toFixed(0)}/${sample.g.toFixed(0)}/${sample.b.toFixed(0)} (${count})`;
  };
  return ["wall", "floor", "door"].map(part).join(", ");
}

function raySummary(reading) {
  return Object.entries(reading.firstHits ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => `${id}:${n}`)
    .join(" ");
}

function remember(label, reading) {
  recorded.set(label, reading);
}

/**
 * @param {string} label still id, usually the output filename
 * @param {boolean} record write this reading instead of comparing it
 */
export function surfaceProblems(label, reading, bands, record) {
  const problems = [];
  for (const kind of surfaceKindsForLabel(label)) {
    const sample = reading[kind];
    const count = reading.counts?.[kind] ?? 0;
    const band = bands?.samples?.[`${label}:${kind}`];
    if (!sample || count < MIN_HITS) {
      // Too little of this surface is in frame to agree a band. A band that
      // already exists still fails, so a surface cannot quietly disappear.
      if (!band) continue;
      const seen = raySummary(reading);
      problems.push(`${label} ${kind}: ${count} hits, need ${MIN_HITS}${seen ? ` (rays ${seen})` : ""}`);
      continue;
    }
    if (record) continue;
    if (!band) {
      problems.push(`${label} ${kind}: no band (luma ${sample.luma.toFixed(0)}). Re-run with --record-bands after review.`);
      continue;
    }
    const tolerance = band.tolerance ?? DEFAULT_TOLERANCE;
    if (Math.abs(sample.luma - band.luma) > tolerance) {
      problems.push(`${label} ${kind}: luma ${sample.luma.toFixed(0)} outside ${band.luma}±${tolerance}`);
    }
  }
  if (record && problems.length === 0) remember(label, reading);
  return problems;
}

export function surfaceLabel(rel) {
  return rel.split("/").at(-1).replace(/\.(webp|png)$/, "");
}

export async function collectSurfaceProblems(page, label, bands, record) {
  let reading;
  try {
    reading = await readStillSurfacesFromPage(page);
  } catch (error) {
    return [`${label}: ${error instanceof Error ? error.message : String(error)}`];
  }
  console.log(`  ${label} — ${formatSurfaces(reading)}`);
  return surfaceProblems(label, reading, bands, record);
}

export async function writeRecordedBands(root) {
  if (recorded.size === 0) return null;
  const existing = await loadSurfaceBands(root);
  const samples = { ...(existing?.samples ?? {}) };
  for (const [label, reading] of recorded) {
    for (const kind of surfaceKindsForLabel(label)) {
      const sample = reading[kind];
      const count = reading.counts?.[kind] ?? 0;
      if (!sample || count < MIN_HITS) continue;
      samples[`${label}:${kind}`] = {
        luma: Math.round(sample.luma),
        r: Math.round(sample.r),
        g: Math.round(sample.g),
        b: Math.round(sample.b),
        tolerance: DEFAULT_TOLERANCE,
      };
    }
  }
  const payload = {
    quality: "client-preview",
    deviceScaleFactor: 2,
    note: "Pass bands from the first client-preview DPR 2 re-render. A daylight wall near 231 is an overexposure warning, not a target.",
    samples,
  };
  const path = join(root, SURFACE_BANDS_FILE);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`);
  return path;
}
