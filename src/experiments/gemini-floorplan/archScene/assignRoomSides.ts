import type { ArchPoint, ArchitecturalWall, ArchRoom } from "./archSceneTypes";

function pointInPoly(p: ArchPoint, poly: ArchPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i].y;
    const yj = poly[j].y;
    const xi = poly[i].x;
    const xj = poly[j].x;
    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function sideNormal(w: ArchitecturalWall): ArchPoint {
  const dx = w.end.x - w.start.x;
  const dy = w.end.y - w.start.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

/** Assign roomLeft / roomRight by probing offsets from wall centerline. */
export function assignRoomSides(walls: ArchitecturalWall[], rooms: ArchRoom[]): ArchitecturalWall[] {
  if (!rooms.length) return walls;
  return walls.map((w) => {
    const mx = (w.start.x + w.end.x) / 2;
    const my = (w.start.y + w.end.y) / 2;
    const n = sideNormal(w);
    const leftP = { x: mx + n.x * 150, y: my + n.y * 150 };
    const rightP = { x: mx - n.x * 150, y: my - n.y * 150 };
    let roomLeft: string | undefined;
    let roomRight: string | undefined;
    for (const r of rooms) {
      if (r.outlineMm.length >= 3 && pointInPoly(leftP, r.outlineMm)) roomLeft = r.id;
      if (r.outlineMm.length >= 3 && pointInPoly(rightP, r.outlineMm)) roomRight = r.id;
    }
    return { ...w, roomLeft, roomRight };
  });
}
