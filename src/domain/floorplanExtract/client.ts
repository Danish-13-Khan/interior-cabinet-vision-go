import { floorplanApiBase } from "./config";
import type { ExtractionResult } from "./types";
import { assertExtractionShape } from "./validateExtract";
import { coerceExtractionToMeters } from "./units";

export type ExtractQuery = {
  mode?: "raster2seq" | "yytsi" | "stub";
  pixel_scale?: number;
  ref_length_m?: number;
  ref_length_px?: number;
  profile?: "full" | "lite";
};

function buildQuery(q: ExtractQuery): string {
  const p = new URLSearchParams();
  if (q.mode) p.set("mode", q.mode);
  if (q.pixel_scale != null) p.set("pixel_scale", String(q.pixel_scale));
  if (q.ref_length_m != null) p.set("ref_length_m", String(q.ref_length_m));
  if (q.ref_length_px != null) p.set("ref_length_px", String(q.ref_length_px));
  if (q.profile) p.set("profile", q.profile);
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function extractFloorplan(file: File, query: ExtractQuery = {}): Promise<ExtractionResult> {
  const body = new FormData();
  body.append("file", file, file.name);
  const res = await fetch(`${floorplanApiBase()}/extract${buildQuery(query)}`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(await readError(res));
  const shaped = assertExtractionShape(await res.json());
  return coerceExtractionToMeters(shaped);
}

export async function exportFloorplanGlb(extraction: ExtractionResult): Promise<Blob> {
  const res = await fetch(
    `${floorplanApiBase()}/export/glb?strict=0&props=1&floors=1&doors=1&frames=1&glass=1&trim=1&union=1`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extraction),
    },
  );
  const ctype = res.headers.get("content-type") ?? "";
  if (!res.ok || ctype.includes("application/json")) {
    throw new Error(await readError(res));
  }
  return await res.blob();
}

export type PatchOp = {
  kind: string;
  pixel_scale?: number;
  rescale_coords?: boolean;
  group?: string;
  id?: string;
  polygon?: unknown;
  polygons?: unknown[];
  defaults?: unknown;
};

export async function patchFloorplanGeometry(
  extraction: ExtractionResult,
  ops: PatchOp[],
  enrich = false,
): Promise<ExtractionResult> {
  const res = await fetch(
    `${floorplanApiBase()}/geometry/patch${enrich ? "?enrich=true" : ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraction, ops, enrich }),
    },
  );
  if (!res.ok) throw new Error(await readError(res));
  const shaped = assertExtractionShape(await res.json());
  return coerceExtractionToMeters(shaped);
}

export async function floorplanReady(): Promise<boolean> {
  try {
    const res = await fetch(`${floorplanApiBase()}/readyz`);
    if (!res.ok) return false;
    const j = (await res.json()) as { ok?: boolean };
    return Boolean(j.ok);
  } catch {
    return false;
  }
}
