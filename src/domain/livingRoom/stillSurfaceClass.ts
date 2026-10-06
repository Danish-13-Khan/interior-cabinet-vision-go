/** Semantic pixels for the Phase 0 stills proof. Bands are measured, not the 231 wall warning. */

export type StillSurfaceKind = "wall" | "floor" | "door";

export type StillSurfaceTags = {
  primitiveId?: string;
  pickKind?: string;
};

export type StillRgb = { r: number; g: number; b: number; luma: number };

export type StillSurfaceReading = {
  wall: StillRgb | null;
  floor: StillRgb | null;
  door: StillRgb | null;
  counts: Record<StillSurfaceKind, number>;
  /** Primitive ids reached by the sample rays, including hits behind furniture. */
  firstHits?: Record<string, number>;
};

export function stillLuma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cabinet fronts are `front-*` (millwork) or `door` / `drawer-front` (construction panels). */
export function classifyStillSurface(tags: StillSurfaceTags): StillSurfaceKind | null {
  const id = tags.primitiveId ?? "";
  if (id === "floor" || id === "flooring") return "floor";
  if (id === "wall-panel" || tags.pickKind === "wall") return "wall";
  if (
    id.startsWith("front-")
    || id === "door"
    || id.startsWith("door-")
    || id.startsWith("left-door")
    || id.startsWith("right-door")
    || id.startsWith("drawer-front")
  ) return "door";
  return null;
}

function mean(samples: StillRgb[]): StillRgb | null {
  if (!samples.length) return null;
  const r = samples.reduce((sum, sample) => sum + sample.r, 0) / samples.length;
  const g = samples.reduce((sum, sample) => sum + sample.g, 0) / samples.length;
  const b = samples.reduce((sum, sample) => sum + sample.b, 0) / samples.length;
  return { r, g, b, luma: stillLuma(r, g, b) };
}

/**
 * Wall and floor are the mean of every hit. The door is the darker half, so a
 * white leaf does not pull the walnut reading up.
 */
export function summarizeStillSurfaces(
  samples: { kind: StillSurfaceKind; rgb: StillRgb }[],
): StillSurfaceReading {
  const buckets: Record<StillSurfaceKind, StillRgb[]> = { wall: [], floor: [], door: [] };
  for (const sample of samples) buckets[sample.kind].push(sample.rgb);
  const doors = [...buckets.door].sort((a, b) => a.luma - b.luma);
  const darkerDoors = doors.slice(0, Math.ceil(doors.length / 2));
  return {
    wall: mean(buckets.wall),
    floor: mean(buckets.floor),
    door: mean(darkerDoors),
    counts: {
      wall: buckets.wall.length,
      floor: buckets.floor.length,
      door: buckets.door.length,
    },
  };
}
