import type { ExtractionResult, ExtractPolygon } from "./types";

const PREFIX: Record<string, string> = {
  walls: "wall-",
  rooms: "room-",
  doors: "door-",
  windows: "window-",
  stairs: "stair-",
};

function groupList(draft: ExtractionResult, key: keyof typeof PREFIX): ExtractPolygon[] {
  if (key === "stairs") return draft.polygons.stairs ?? [];
  return draft.polygons[key as "walls" | "rooms" | "doors" | "windows"] ?? [];
}

/** Reserve existing ids; mint collision-free fallbacks once. No-op for already-id'd polys. */
export function ensureCollisionFreeIds(draft: ExtractionResult): ExtractionResult {
  const reserved = new Set<string>();
  for (const key of Object.keys(PREFIX) as (keyof typeof PREFIX)[]) {
    for (const poly of groupList(draft, key)) {
      const id = poly.id?.trim();
      if (id) reserved.add(id);
    }
  }
  const assigned = new Set<string>();

  const nextFree = (prefix: string) => {
    let n = 0;
    while (reserved.has(`${prefix}${n}`) || assigned.has(`${prefix}${n}`)) n += 1;
    const id = `${prefix}${n}`;
    reserved.add(id);
    assigned.add(id);
    return id;
  };

  const mapGroup = (key: keyof typeof PREFIX): ExtractPolygon[] =>
    groupList(draft, key).map((poly) => {
      const id = poly.id?.trim();
      if (id && !assigned.has(id)) {
        assigned.add(id);
        return { ...poly, id };
      }
      return { ...poly, id: nextFree(PREFIX[key]) };
    });

  return {
    ...draft,
    polygons: {
      rooms: mapGroup("rooms"),
      walls: mapGroup("walls"),
      doors: mapGroup("doors"),
      windows: mapGroup("windows"),
      stairs: mapGroup("stairs"),
    },
  };
}
