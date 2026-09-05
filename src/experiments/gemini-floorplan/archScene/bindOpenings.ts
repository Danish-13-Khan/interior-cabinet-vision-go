import { distMm } from "../proposalGeom";
import type { GeminiFloorProposal } from "../proposalTypes";
import type { ArchitecturalOpening, ArchitecturalWall } from "./archSceneTypes";

function projectT(
  wall: ArchitecturalWall,
  point: { x: number; y: number },
): number {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return 0.5;
  const t = ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / len2;
  return Math.min(1, Math.max(0, t));
}

function wallPointAt(wall: ArchitecturalWall, t: number) {
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    y: wall.start.y + (wall.end.y - wall.start.y) * t,
  };
}

/** Bind openings to nearest wall with parametric offset (Phase 8). */
export function bindOpeningsToWalls(
  walls: ArchitecturalWall[],
  proposal: GeminiFloorProposal,
): { walls: ArchitecturalWall[]; openings: ArchitecturalOpening[] } {
  if (!walls.length) return { walls, openings: [] };
  const openings: ArchitecturalOpening[] = [];
  const wallOpenings = new Map<string, string[]>();

  for (const op of proposal.openings ?? []) {
    let host = walls.find((w) => w.id === op.wallId) ?? null;
    let t = 0.5;
    if (!host) {
      // fallback: middle of longest wall
      host = [...walls].sort(
        (a, b) => distMm(b.start, b.end) - distMm(a.start, a.end),
      )[0];
    }
    if (op.wallId && host) {
      const mid = {
        x: (host.start.x + host.end.x) / 2,
        y: (host.start.y + host.end.y) / 2,
      };
      t = projectT(host, mid);
    }
    const widthMm = op.widthMm && op.widthMm > 0 ? op.widthMm : 900;
    const heightMm =
      op.heightMm && op.heightMm > 0 ? op.heightMm : op.kind === "window" ? 1200 : 2100;
    let opening: ArchitecturalOpening = {
      id: op.id,
      kind: op.kind,
      wallId: host.id,
      t,
      widthMm,
      heightMm,
      sillMm: op.kind === "window" ? 900 : 0,
      swing: op.kind === "door" ? "unknown" : undefined,
    };
    if (opening.kind === "door") {
      opening = { ...opening, swing: inferDoorSwing(opening) };
    }
    openings.push(opening);
    const list = wallOpenings.get(host.id) ?? [];
    list.push(opening.id);
    wallOpenings.set(host.id, list);
  }

  const nextWalls = walls.map((w) => ({
    ...w,
    openingIds: wallOpenings.get(w.id) ?? [],
  }));
  return { walls: nextWalls, openings };
}

export function openingWorldCenter(wall: ArchitecturalWall, opening: ArchitecturalOpening) {
  return wallPointAt(wall, opening.t);
}

export function moveOpeningAlongWall(
  openings: ArchitecturalOpening[],
  openingId: string,
  t: number,
): ArchitecturalOpening[] {
  return openings.map((o) =>
    o.id === openingId ? { ...o, t: Math.min(1, Math.max(0, t)) } : o,
  );
}

export function resizeOpening(
  openings: ArchitecturalOpening[],
  openingId: string,
  widthMm: number,
  heightMm?: number,
): ArchitecturalOpening[] {
  return openings.map((o) =>
    o.id === openingId
      ? {
          ...o,
          widthMm: Math.max(200, widthMm),
          heightMm: heightMm != null ? Math.max(400, heightMm) : o.heightMm,
        }
      : o,
  );
}

export function rehostOpening(
  openings: ArchitecturalOpening[],
  openingId: string,
  wallId: string,
  t = 0.5,
): ArchitecturalOpening[] {
  return openings.map((o) => (o.id === openingId ? { ...o, wallId, t } : o));
}

export function setOpeningSwing(
  openings: ArchitecturalOpening[],
  openingId: string,
  swing: "left" | "right" | "unknown",
): ArchitecturalOpening[] {
  return openings.map((o) => (o.id === openingId ? { ...o, swing } : o));
}

/** G-8.3 heuristic: doors nearer start → left swing. */
export function inferDoorSwing(opening: ArchitecturalOpening): "left" | "right" | "unknown" {
  if (opening.kind !== "door") return "unknown";
  if (opening.swing && opening.swing !== "unknown") return opening.swing;
  return opening.t < 0.5 ? "left" : "right";
}
