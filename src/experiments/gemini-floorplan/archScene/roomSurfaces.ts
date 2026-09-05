import type {
  ArchitecturalScene,
  ArchitecturalWall,
  ArchRoom,
  CeilingSurface,
  FloorSurface,
} from "./archSceneTypes";
import { wallAdjacency } from "./wallTopology";

/** Closed room faces from outlines + adjacency via shared walls (Phase 9). */
export function buildRoomSurfaces(scene: ArchitecturalScene): {
  rooms: ArchRoom[];
  floors: FloorSurface[];
  ceilings: CeilingSurface[];
} {
  const adj = wallAdjacency(scene.wallJunctions);
  const rooms: ArchRoom[] = scene.rooms.map((r) => {
    const wallIds = scene.walls
      .filter((w) => w.roomLeft === r.id || w.roomRight === r.id)
      .map((w) => w.id);
    const neighbor = new Set<string>();
    for (const wid of wallIds) {
      for (const other of scene.walls) {
        if (other.id === wid) continue;
        if (!adj.get(wid)?.includes(other.id)) continue;
        if (other.roomLeft && other.roomLeft !== r.id) neighbor.add(other.roomLeft);
        if (other.roomRight && other.roomRight !== r.id) neighbor.add(other.roomRight);
      }
    }
    return { ...r, adjacentRoomIds: [...neighbor] };
  });

  const floors: FloorSurface[] = rooms
    .filter((r) => r.outlineMm.length >= 3)
    .map((r) => ({ id: `floor-${r.id}`, roomId: r.id, outlineMm: r.outlineMm }));

  const ceilings: CeilingSurface[] = rooms
    .filter((r) => r.outlineMm.length >= 3)
    .map((r) => ({
      id: `ceil-${r.id}`,
      roomId: r.id,
      outlineMm: r.outlineMm,
      heightMm: r.ceilingHeightMm,
    }));

  return { rooms, floors, ceilings };
}

export function findOpenLoops(walls: ArchitecturalWall[]): string[] {
  const ends = new Map<string, number>();
  const key = (p: { x: number; y: number }) => `${Math.round(p.x)},${Math.round(p.y)}`;
  for (const w of walls) {
    ends.set(key(w.start), (ends.get(key(w.start)) ?? 0) + 1);
    ends.set(key(w.end), (ends.get(key(w.end)) ?? 0) + 1);
  }
  return [...ends.entries()].filter(([, n]) => n === 1).map(([k]) => k);
}
