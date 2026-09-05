import { proposalBounds, wallLengthMm } from "./proposalBounds";
import type { GeminiFloorProposal, OpeningKind, ProposalWall } from "./proposalTypes";

const MM = 0.001;
const DEFAULT_THICKNESS_MM = 100;

export type ShellBoxKind = "wall" | "floor" | "opening";

export type ShellBox = {
  id: string;
  kind: ShellBoxKind;
  /** World position in metres (Y up). */
  position: [number, number, number];
  /** Box size metres: length(X local), height(Y), thickness(Z local). */
  size: [number, number, number];
  rotationY: number;
  openingKind?: OpeningKind;
};

export type RoomShellModel = {
  boxes: ShellBox[];
  center: [number, number, number];
  cameraPosition: [number, number, number];
  wallHeightM: number;
};

function wallTransform(wall: ProposalWall, heightMm: number): Omit<ShellBox, "id" | "kind"> {
  const lenMm = Math.max(wallLengthMm(wall), 1);
  const thickMm = wall.thicknessMm && wall.thicknessMm > 0 ? wall.thicknessMm : DEFAULT_THICKNESS_MM;
  const mx = (wall.a.x + wall.b.x) / 2;
  const my = (wall.a.y + wall.b.y) / 2;
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  const rotationY = -Math.atan2(dy, dx);
  return {
    position: [mx * MM, (heightMm * MM) / 2, my * MM],
    size: [lenMm * MM, heightMm * MM, thickMm * MM],
    rotationY,
  };
}

function openingMarker(
  proposal: GeminiFloorProposal,
  wall: ProposalWall,
  op: NonNullable<GeminiFloorProposal["openings"]>[number],
): ShellBox | null {
  const heightMm = proposal.assumedWallHeightMm;
  const base = wallTransform(wall, heightMm);
  const widthMm = op.widthMm && op.widthMm > 0 ? op.widthMm : 900;
  const openH = op.heightMm && op.heightMm > 0 ? op.heightMm : op.kind === "window" ? 1200 : 2100;
  const sillMm = op.kind === "window" ? 900 : 0;
  const thickMm = (wall.thicknessMm && wall.thicknessMm > 0 ? wall.thicknessMm : DEFAULT_THICKNESS_MM) * 1.4;
  return {
    id: op.id,
    kind: "opening",
    openingKind: op.kind,
    position: [base.position[0], (sillMm + openH / 2) * MM, base.position[2]],
    size: [widthMm * MM, openH * MM, thickMm * MM],
    rotationY: base.rotationY,
  };
}

/** Deterministic proposal → box shell (metres). Same JSON → same boxes. */
export function buildRoomShell(proposal: GeminiFloorProposal): RoomShellModel | null {
  const bounds = proposalBounds(proposal);
  if (!bounds || proposal.walls.length === 0) return null;

  const wallHeightMm = proposal.assumedWallHeightMm > 0 ? proposal.assumedWallHeightMm : 2700;
  const boxes: ShellBox[] = [];

  boxes.push({
    id: "floor",
    kind: "floor",
    position: [
      (bounds.minX + bounds.maxX) / 2 * MM,
      0.01,
      (bounds.minY + bounds.maxY) / 2 * MM,
    ],
    size: [bounds.width * MM, 0.02, bounds.height * MM],
    rotationY: 0,
  });

  for (const wall of proposal.walls) {
    const t = wallTransform(wall, wallHeightMm);
    boxes.push({ id: wall.id, kind: "wall", ...t });
  }

  for (const op of proposal.openings ?? []) {
    const wall = proposal.walls.find((w) => w.id === op.wallId) ?? proposal.walls[0];
    if (!wall) continue;
    const marker = openingMarker(proposal, wall, op);
    if (marker) boxes.push(marker);
  }

  const cx = (bounds.minX + bounds.maxX) / 2 * MM;
  const cz = (bounds.minY + bounds.maxY) / 2 * MM;
  const span = Math.max(bounds.width, bounds.height) * MM;
  const wallHeightM = wallHeightMm * MM;

  return {
    boxes,
    center: [cx, wallHeightM * 0.35, cz],
    cameraPosition: [cx + span * 0.9, wallHeightM * 1.4, cz + span * 0.9],
    wallHeightM,
  };
}
