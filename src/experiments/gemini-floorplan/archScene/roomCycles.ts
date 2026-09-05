import type { ArchPoint, ArchitecturalWall, WallJunction } from "./archSceneTypes";

type Edge = { to: string; wallId: string };

/** G-9.1: find simple cycles in the wall junction graph → room outlines. */
export function traceRoomCycles(
  walls: ArchitecturalWall[],
  junctions: WallJunction[],
): ArchPoint[][] {
  if (junctions.length < 3 || walls.length < 3) return [];
  const byId = new Map(junctions.map((j) => [j.id, j]));
  const graph = new Map<string, Edge[]>();
  for (const j of junctions) graph.set(j.id, []);

  for (const w of walls) {
    if (!w.junctionStartId || !w.junctionEndId) continue;
    graph.get(w.junctionStartId)?.push({ to: w.junctionEndId, wallId: w.id });
    graph.get(w.junctionEndId)?.push({ to: w.junctionStartId, wallId: w.id });
  }

  const cycles: string[][] = [];
  const seen = new Set<string>();

  function dfs(start: string, node: string, path: string[], usedWalls: Set<string>) {
    if (path.length > 12) return;
    for (const e of graph.get(node) ?? []) {
      if (usedWalls.has(e.wallId)) continue;
      if (e.to === start && path.length >= 3) {
        const key = [...path].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push([...path]);
        }
        continue;
      }
      if (path.includes(e.to)) continue;
      usedWalls.add(e.wallId);
      path.push(e.to);
      dfs(start, e.to, path, usedWalls);
      path.pop();
      usedWalls.delete(e.wallId);
    }
  }

  for (const j of junctions) {
    dfs(j.id, j.id, [j.id], new Set());
  }

  // Prefer shortest unique cycles (room faces)
  cycles.sort((a, b) => a.length - b.length);
  const outlines: ArchPoint[][] = [];
  const used = new Set<string>();
  for (const cyc of cycles) {
    const key = [...cyc].sort().join("|");
    if (used.has(key)) continue;
    // skip if this cycle contains a shorter already-accepted cycle's nodes only as superset of many
    outlines.push(cyc.map((id) => ({ ...byId.get(id)!.point })));
    used.add(key);
    if (outlines.length >= 8) break;
  }
  return outlines;
}
