import { floorplanApiBase } from "./config";
import type { ExtractionResult } from "./types";
import { assertExtractionShape } from "./validateExtract";

type JsonSchema = {
  required?: string[];
  properties?: Record<string, {
    const?: unknown;
    enum?: unknown[];
    type?: string | string[];
    properties?: Record<string, { enum?: unknown[]; const?: unknown }>;
  }>;
};

let cached: JsonSchema | null = null;

export async function fetchFloorplanSchema(force = false): Promise<JsonSchema> {
  if (cached && !force) return cached;
  const res = await fetch(`${floorplanApiBase()}/schema/v1`);
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      msg = j.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg || `GET /schema/v1 failed (${res.status})`);
  }
  cached = (await res.json()) as JsonSchema;
  return cached;
}

/** Contract extras the hosted /schema/v1 enum sometimes omits (DXF → vector). */
const CONTRACT_SOURCE_MODES = ["stub", "yytsi", "raster2seq", "vector", "worker"];

function checkEnum(path: string, value: unknown, allowed: unknown[] | undefined) {
  if (!allowed || allowed.length === 0) return;
  if (!allowed.includes(value)) {
    throw new Error(`schema: ${path}=${JSON.stringify(value)} not in ${JSON.stringify(allowed)}`);
  }
}

function sourceModeAllowed(liveEnum: unknown[] | undefined): unknown[] {
  return [...new Set([...(liveEnum ?? []), ...CONTRACT_SOURCE_MODES])];
}

/** Live GET /schema/v1 checks on top of structural assertExtractionShape. */
export async function validateExtractionAgainstLiveSchema(raw: unknown): Promise<ExtractionResult> {
  const schema = await fetchFloorplanSchema();
  const shaped = assertExtractionShape(raw);
  for (const key of schema.required ?? ["schema_version", "units", "polygons"]) {
    if ((shaped as Record<string, unknown>)[key] == null && key !== "polygons") {
      // polygons always present after assert
      if (!(key in shaped)) throw new Error(`schema: missing required "${key}"`);
    }
  }
  const props = schema.properties ?? {};
  if (props.schema_version?.const != null && shaped.schema_version !== props.schema_version.const) {
    throw new Error(`schema: schema_version must be ${JSON.stringify(props.schema_version.const)}`);
  }
  checkEnum("units", shaped.units, props.units?.enum as unknown[] | undefined);
  if (shaped.source?.mode != null) {
    const modeEnum = props.source?.properties?.mode?.enum as unknown[] | undefined;
    checkEnum("source.mode", shaped.source.mode, sourceModeAllowed(modeEnum));
  }
  if (shaped.source?.quality != null) {
    const qEnum = props.source?.properties?.quality?.enum as unknown[] | undefined;
    checkEnum("source.quality", shaped.source.quality, qEnum);
  }
  return shaped;
}

export function clearFloorplanSchemaCache() {
  cached = null;
}
