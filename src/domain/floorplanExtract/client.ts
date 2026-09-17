import { floorplanApiBase } from "./config";
import { getFloorplanGlb } from "./glbExportCache";
import { fetchFloorplanSidecarStatus } from "./floorplanSidecarStatus";
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

export type LiveSchemaStatus =
  | { state: "live-ok" }
  | { state: "structural-fallback"; message: string }
  | { state: "live-rejected"; message: string };

export type ExtractionIngest = {
  draft: ExtractionResult;
  liveSchema: LiveSchemaStatus;
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

export async function ingestExtractionJson(raw: unknown): Promise<ExtractionIngest> {
  const shaped = assertExtractionShape(raw);
  try {
    await validateExtractionAgainstLiveSchema(raw);
    return { draft: coerceExtractionToMeters(shaped), liveSchema: { state: "live-ok" } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("schema:")) {
      throw Object.assign(new Error(msg), { liveSchema: { state: "live-rejected", message: msg } satisfies LiveSchemaStatus });
    }
    return {
      draft: coerceExtractionToMeters(shaped),
      liveSchema: {
        state: "structural-fallback",
        message: msg || "Live GET /schema/v1 unavailable — structural checks only",
      },
    };
  }
}

export async function extractFloorplan(file: File, query: ExtractQuery = {}): Promise<ExtractionIngest> {
  if (
    query.pixel_scale == null
    && ((query.ref_length_m == null) !== (query.ref_length_px == null))
  ) {
    throw new Error("ref_length_m and ref_length_px must both be set for scale calibration");
  }
  const body = new FormData();
  body.append("file", file, file.name);
  const base = floorplanApiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/extract${buildQuery(query)}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("Floor-plan generation timed out after two minutes. Try again once the service is ready.");
    }
    throw new Error(`Could not reach the floor-plan service at ${base}. ${/localhost|127\.0\.0\.1/.test(base) ? "Start the local floor-plan sidecar, or configure VITE_FLOORPLAN_API_BASE with your hosted service and rebuild." : "Check the service is online and allows requests from this website, then try again."}`);
  }
  if (!res.ok) throw new Error(await readError(res));
  return ingestExtractionJson(await res.json());
}

/** Preview/download GLB — shares fingerprint cache with in-app preview (P0a). */
export async function exportFloorplanGlb(
  extraction: ExtractionResult,
  opts?: { signal?: AbortSignal },
): Promise<Blob> {
  const handle = await getFloorplanGlb(extraction, { signal: opts?.signal });
  return handle.blob;
}

export async function patchFloorplanGeometry(
  extraction: ExtractionResult,
  ops: PatchOp[],
  enrich = false,
): Promise<ExtractionIngest> {
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
  const status = await fetchFloorplanSidecarStatus();
  return status.ok;
}
