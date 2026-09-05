import { distMm } from "../proposalGeom";
import type { ArchitecturalOpening, ArchitecturalScene, ArchitecturalWall } from "./archSceneTypes";

const MM = 0.001;

export type ArchShellBox = {
  id: string;
  kind: "wall" | "floor" | "opening" | "ceiling" | "skirting" | "frame" | "fixture";
  position: [number, number, number];
  size: [number, number, number];
  rotationY: number;
  openingKind?: ArchitecturalOpening["kind"];
  materialId?: string;
  entityId?: string;
};

/** Phase 11: procedural boxes from ArchitecturalScene (openings as cut markers + frames). */
export function buildArchShell(scene: ArchitecturalScene): ArchShellBox[] {
  const boxes: ArchShellBox[] = [];
  for (const floor of scene.floors) {
    const xs = floor.outlineMm.map((p) => p.x);
    const ys = floor.outlineMm.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const room = scene.rooms.find((r) => r.id === floor.roomId);
    const n = (room?.name ?? "").toLowerCase();
    boxes.push({
      id: floor.id,
      kind: "floor",
      entityId: floor.roomId,
      position: [((minX + maxX) / 2) * MM, 0.01, ((minY + maxY) / 2) * MM],
      size: [(maxX - minX) * MM, 0.02, (maxY - minY) * MM],
      rotationY: 0,
      materialId: n.includes("kitchen")
        ? "floor-kitchen"
        : n.includes("bath")
          ? "floor-bath"
          : "floor-default",
    });
  }
  for (const wall of scene.walls) {
    boxes.push(...wallBoxesWithOpenings(wall, scene.openings, scene.skirtingMm));
  }
  for (const ceil of scene.ceilings) {
    const xs = ceil.outlineMm.map((p) => p.x);
    const ys = ceil.outlineMm.map((p) => p.y);
    boxes.push({
      id: ceil.id,
      kind: "ceiling",
      entityId: ceil.roomId,
      position: [
        ((Math.min(...xs) + Math.max(...xs)) / 2) * MM,
        ceil.heightMm * MM,
        ((Math.min(...ys) + Math.max(...ys)) / 2) * MM,
      ],
      size: [
        (Math.max(...xs) - Math.min(...xs)) * MM,
        0.02,
        (Math.max(...ys) - Math.min(...ys)) * MM,
      ],
      rotationY: 0,
      materialId: "ceiling-default",
    });
  }
  for (const f of scene.fixtures) {
    if (f.review === "rejected") continue;
    boxes.push({
      id: f.id,
      kind: "fixture",
      entityId: f.id,
      position: [f.anchorMm.x * MM, 0.45, f.anchorMm.y * MM],
      size: [0.5, 0.9, 0.5],
      rotationY: 0,
      materialId: "fixture",
    });
  }
  return boxes;
}

function wallBoxesWithOpenings(
  wall: ArchitecturalWall,
  openings: ArchitecturalOpening[],
  skirtingMm: number,
): ArchShellBox[] {
  const len = Math.max(distMm(wall.start, wall.end), 1);
  const thick = wall.thicknessMm * MM;
  const h = wall.heightMm * MM;
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const rot = -Math.atan2(dy, dx);
  const hosted = openings.filter((o) => o.wallId === wall.id);
  const mid = {
    id: wall.id,
    kind: "wall" as const,
    entityId: wall.id,
    position: [((wall.start.x + wall.end.x) / 2) * MM, h / 2, ((wall.start.y + wall.end.y) / 2) * MM] as [
      number,
      number,
      number,
    ],
    size: [len * MM, h, thick] as [number, number, number],
    rotationY: rot,
    materialId: wall.type === "exterior" ? "wall-exterior" : "wall-interior",
  };
  const skirtH = Math.max(skirtingMm, 1) * MM;
  const skirt: ArchShellBox = {
    id: `${wall.id}-skirt`,
    kind: "skirting",
    entityId: wall.id,
    position: [mid.position[0], skirtH / 2, mid.position[2]],
    size: [len * MM, skirtH, thick * 1.15],
    rotationY: rot,
    materialId: "skirting",
  };
  if (!hosted.length) return [mid, skirt];

  const out: ArchShellBox[] = [skirt];
  const sorted = [...hosted].sort((a, b) => a.t - b.t);
  let cursor = 0;
  let seg = 0;
  for (const op of sorted) {
    const half = op.widthMm / 2 / len;
    const a = Math.max(0, op.t - half);
    const b = Math.min(1, op.t + half);
    if (a > cursor + 0.01) {
      out.push(segmentBox(wall, cursor, a, rot, h, thick, `${wall.id}-s${seg++}`));
    }
    const midT = (a + b) / 2;
    const mx = wall.start.x + dx * midT;
    const my = wall.start.y + dy * midT;
    const openH = op.heightMm * MM;
    const sill = op.sillMm * MM;
    out.push({
      id: op.id,
      kind: "opening",
      entityId: op.id,
      openingKind: op.kind,
      position: [mx * MM, sill + openH / 2, my * MM],
      size: [op.widthMm * MM, openH, thick * 1.35],
      rotationY: rot,
      materialId: op.kind === "door" ? "door" : "window",
    });
    // Frame around opening (void proxy + frame)
    out.push({
      id: `${op.id}-frame`,
      kind: "frame",
      entityId: op.id,
      position: [mx * MM, sill + openH / 2, my * MM],
      size: [op.widthMm * MM + 0.04, openH + 0.04, thick * 1.5],
      rotationY: rot,
      materialId: "frame",
    });
    cursor = b;
  }
  if (cursor < 0.99) {
    out.push(segmentBox(wall, cursor, 1, rot, h, thick, `${wall.id}-s${seg++}`));
  }
  return out;
}

function segmentBox(
  wall: ArchitecturalWall,
  t0: number,
  t1: number,
  rot: number,
  h: number,
  thick: number,
  id: string,
): ArchShellBox {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const ax = wall.start.x + dx * t0;
  const ay = wall.start.y + dy * t0;
  const bx = wall.start.x + dx * t1;
  const by = wall.start.y + dy * t1;
  const len = Math.max(distMm({ x: ax, y: ay }, { x: bx, y: by }), 1);
  return {
    id,
    kind: "wall",
    entityId: wall.id,
    position: [((ax + bx) / 2) * MM, h / 2, ((ay + by) / 2) * MM],
    size: [len * MM, h, thick],
    rotationY: rot,
    materialId: wall.type === "exterior" ? "wall-exterior" : "wall-interior",
  };
}
