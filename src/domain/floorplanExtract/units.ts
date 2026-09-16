import type { ExtractionResult, ExtractPolygon, PointM } from "./types";

function scaleRing(ring: PointM[], factor: number): PointM[] {
  return ring.map(([x, y]) => [x * factor, y * factor] as PointM);
}

function scalePoly(poly: ExtractPolygon, factor: number): ExtractPolygon {
  return {
    ...poly,
    outer: scaleRing(poly.outer, factor),
    holes: poly.holes?.map((h) => scaleRing(h, factor)),
  };
}

/** Coerce extraction coordinates to meters before graph work. */
export function coerceExtractionToMeters(raw: ExtractionResult): ExtractionResult {
  if (raw.units === "meters" || !raw.units) {
    return { ...raw, units: "meters" };
  }
  if (raw.units !== "centimeters") {
    throw new Error(`Unsupported extraction units: ${raw.units}`);
  }
  const factor = 0.01;
  const scale = raw.pixel_scale == null ? null : raw.pixel_scale * factor;
  return {
    ...raw,
    units: "meters",
    pixel_scale: scale,
    polygons: {
      rooms: raw.polygons.rooms.map((p) => scalePoly(p, factor)),
      walls: raw.polygons.walls.map((p) => scalePoly(p, factor)),
      doors: raw.polygons.doors.map((p) => scalePoly(p, factor)),
      windows: raw.polygons.windows.map((p) => scalePoly(p, factor)),
      stairs: (raw.polygons.stairs ?? []).map((p) => scalePoly(p, factor)),
    },
    // wall_height_m and opening sill/height are already metres in polygon_v1 — do not scale.
    defaults: raw.defaults ? { ...raw.defaults } : raw.defaults,
  };
}

/** Multiply all draft coordinates by factor (e.g. scale confirm rescale). */
export function rescaleExtractionCoords(raw: ExtractionResult, factor: number): ExtractionResult {
  if (!(factor > 0) || Math.abs(factor - 1) < 1e-12) return raw;
  const ps = raw.pixel_scale == null ? null : raw.pixel_scale * factor;
  return {
    ...raw,
    pixel_scale: ps,
    polygons: {
      rooms: raw.polygons.rooms.map((p) => scalePoly(p, factor)),
      walls: raw.polygons.walls.map((p) => scalePoly(p, factor)),
      doors: raw.polygons.doors.map((p) => scalePoly(p, factor)),
      windows: raw.polygons.windows.map((p) => scalePoly(p, factor)),
      stairs: (raw.polygons.stairs ?? []).map((p) => scalePoly(p, factor)),
    },
  };
}
