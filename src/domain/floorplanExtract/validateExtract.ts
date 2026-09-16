import type { ExtractionResult, ExtractPolygon, PointM } from "./types";

function assertFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid number at ${path}`);
  }
  return value;
}

function assertPoint(value: unknown, path: string): PointM {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(`Point must be [x,y] at ${path}`);
  }
  return [assertFiniteNumber(value[0], `${path}[0]`), assertFiniteNumber(value[1], `${path}[1]`)];
}

function assertRing(value: unknown, path: string): PointM[] {
  if (!Array.isArray(value) || value.length < 3) {
    throw new Error(`Ring needs ≥3 points at ${path}`);
  }
  return value.map((p, i) => assertPoint(p, `${path}[${i}]`));
}

function assertPolygon(value: unknown, path: string): ExtractPolygon {
  if (!value || typeof value !== "object") {
    throw new Error(`Polygon must be an object at ${path}`);
  }
  const p = value as Record<string, unknown>;
  const outer = assertRing(p.outer, `${path}.outer`);
  const poly: ExtractPolygon = { outer };
  if (p.id != null) {
    if (typeof p.id !== "string") throw new Error(`id must be a string at ${path}.id`);
    poly.id = p.id;
  }
  if (p.label != null) {
    if (typeof p.label !== "string") throw new Error(`label must be a string at ${path}.label`);
    poly.label = p.label;
  }
  if (p.confidence != null) {
    if (typeof p.confidence !== "number" || !Number.isFinite(p.confidence)) {
      throw new Error(`confidence must be a finite number at ${path}.confidence`);
    }
    poly.confidence = p.confidence;
  }
  if (p.holes != null) {
    if (!Array.isArray(p.holes)) throw new Error(`holes must be an array at ${path}.holes`);
    poly.holes = p.holes.map((h, i) => assertRing(h, `${path}.holes[${i}]`));
  }
  if (p.material_id != null) {
    if (typeof p.material_id !== "string") throw new Error(`material_id must be a string at ${path}.material_id`);
    poly.material_id = p.material_id;
  }
  if (p.opening != null) {
    if (typeof p.opening !== "object" || !p.opening) {
      throw new Error(`opening must be an object at ${path}.opening`);
    }
    const o = p.opening as Record<string, unknown>;
    poly.opening = {
      sill_m: assertFiniteNumber(o.sill_m ?? 0, `${path}.opening.sill_m`),
      height_m: assertFiniteNumber(o.height_m ?? 0, `${path}.opening.height_m`),
      swing: o.swing == null ? null : String(o.swing),
      wall_height_m: o.wall_height_m == null
        ? undefined
        : assertFiniteNumber(o.wall_height_m, `${path}.opening.wall_height_m`),
    };
  }
  return poly;
}

function assertPolygonList(value: unknown, path: string): ExtractPolygon[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, i) => assertPolygon(item, `${path}[${i}]`));
}

/** Validate extract JSON shape and polygon geometry before normalize/UI. */
export function assertExtractionShape(raw: unknown): ExtractionResult {
  if (!raw || typeof raw !== "object") throw new Error("Extract response is not an object");
  const r = raw as Record<string, unknown>;
  if (r.schema_version !== "1.0") {
    throw new Error(`Unsupported schema_version: ${String(r.schema_version)}`);
  }
  if (r.units !== "meters" && r.units !== "centimeters") {
    throw new Error(`Missing/invalid units: ${String(r.units)}`);
  }
  const polygons = r.polygons as Record<string, unknown> | undefined;
  if (!polygons || typeof polygons !== "object") {
    throw new Error("Extract response missing polygons");
  }
  const shaped: ExtractionResult = {
    schema_version: "1.0",
    units: r.units,
    polygons: {
      rooms: assertPolygonList(polygons.rooms, "polygons.rooms"),
      walls: assertPolygonList(polygons.walls, "polygons.walls"),
      doors: assertPolygonList(polygons.doors, "polygons.doors"),
      windows: assertPolygonList(polygons.windows, "polygons.windows"),
      stairs: polygons.stairs == null
        ? []
        : assertPolygonList(polygons.stairs, "polygons.stairs"),
    },
  };
  if (r.pixel_scale != null) {
    shaped.pixel_scale = assertFiniteNumber(r.pixel_scale, "pixel_scale");
  }
  if (r.image_size != null) {
    if (typeof r.image_size !== "object" || !r.image_size) {
      throw new Error("image_size must be an object");
    }
    const s = r.image_size as Record<string, unknown>;
    shaped.image_size = {
      width: assertFiniteNumber(s.width, "image_size.width"),
      height: assertFiniteNumber(s.height, "image_size.height"),
    };
  }
  if (r.source != null && typeof r.source === "object") {
    shaped.source = r.source as ExtractionResult["source"];
  }
  if (r.defaults != null && typeof r.defaults === "object") {
    const d = r.defaults as Record<string, unknown>;
    shaped.defaults = {
      wall_height_m: d.wall_height_m == null
        ? undefined
        : assertFiniteNumber(d.wall_height_m, "defaults.wall_height_m"),
      materials: d.materials && typeof d.materials === "object"
        ? Object.fromEntries(
          Object.entries(d.materials as Record<string, unknown>).map(([k, v]) => {
            if (typeof v !== "string") throw new Error(`defaults.materials.${k} must be a string`);
            return [k, v];
          }),
        )
        : undefined,
    };
  }
  if (r.furniture_anchors != null) {
    if (!Array.isArray(r.furniture_anchors)) {
      throw new Error("furniture_anchors must be an array");
    }
    shaped.furniture_anchors = r.furniture_anchors;
  }
  return shaped;
}
