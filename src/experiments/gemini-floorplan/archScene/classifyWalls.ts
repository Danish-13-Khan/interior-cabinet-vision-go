import type { ArchitecturalWall, WallKind } from "./archSceneTypes";
import type { WallJunction } from "./archSceneTypes";

/**
 * Heuristic wall classification (Phase 7).
 * Degree-1 endpoints → likely exterior; shared mid walls → interior.
 */
export function classifyWallTypes(
  walls: ArchitecturalWall[],
  junctions: WallJunction[],
): ArchitecturalWall[] {
  const degree = new Map<string, number>();
  for (const j of junctions) {
    for (const id of j.wallIds) degree.set(id, (degree.get(id) ?? 0) + 1);
  }

  return walls.map((w) => {
    const dStart = junctions.find((j) => j.id === w.junctionStartId)?.wallIds.length ?? 1;
    const dEnd = junctions.find((j) => j.id === w.junctionEndId)?.wallIds.length ?? 1;
    let type: WallKind = "unknown";
    if (dStart === 1 || dEnd === 1) type = "exterior";
    else if ((degree.get(w.id) ?? 0) >= 2) type = "interior";
    else type = "partition";
    return {
      ...w,
      type,
      confidence: "medium",
    };
  });
}
