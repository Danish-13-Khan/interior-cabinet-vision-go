import { floorplanApiBase } from "./config";
import type { ExtractionResult } from "./types";
import { assertExtractionShape } from "./validateExtract";
import { coerceExtractionToMeters } from "./units";
import { validateExtractionAgainstLiveSchema } from "./schemaValidate";

export type ExtractQuery = {
  mode?: "raster2seq" | "yytsi" | "stub";
  pixel_scale?: number;
  ref_length_m?: number;
  ref_length_px?: number;
  profile?: "full" | "lite";
};

export type PolygonGroup = "walls" | "rooms" | "doors" | "windows" | "stairs";

export type PatchOp =
  | { kind: "set_scale"; pixel_scale: number; rescale_coords?: boolean }
  | { kind: "upsert_polygon"; group: PolygonGroup; polygon: unknown }
  | { kind: "delete_polygon"; group: PolygonGroup; id: string }
  | { kind: "replace_polygons"; group: PolygonGroup; polygons: unknown[] }
  | { kind: "set_defaults"; defaults: unknown };

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

async function ingestExtractionJson(raw: unknown): Promise<ExtractionResult> {
  // Structural first (works offline); then live schema when sidecar is up.
  const shaped = assertExtractionShape(raw);
  try {
    await validateExtractionAgainstLiveSchema(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // If schema endpoint is down, keep structural result but surface when it's a real schema violation.
    if (msg.startsWith("schema:")) throw err;
    // network / schema fetch failure: allow offline review with shape-only
  }
  return coerceExtractionToMeters(shaped);
}

export async function extractFloorplan(file: File, query: ExtractQuery = {}): Promise<ExtractionResult> {
  if (
    query.pixel_scale == null
    && ((query.ref_length_m == null) !== (query.ref_length_px == null))
  ) {
    throw new Error("ref_length_m and ref_length_px must both be set for scale calibration");
  }
  const body = new FormData();
  body.append("file", file, file.name);
  const res = await fetch(`${floorplanApiBase()}/extract${buildQuery(query)}`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(await readError(res));
  return ingestExtractionJson(await res.json());
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
  return ingestExtractionJson(await res.json());
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
