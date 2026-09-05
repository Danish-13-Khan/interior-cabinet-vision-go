import {
  setPlanWallLength,
  wallLengthMm,
  type InteriorProject,
  type WallEntity,
} from "../interiorProject";

/**
 * Which endpoint stays fixed when a typed wall length is applied.
 * UX default: keep the start node (wall draw direction); the end node moves.
 */
export type WallLengthAnchor = "start" | "end";

export const DEFAULT_WALL_LENGTH_ANCHOR: WallLengthAnchor = "start";

export function wallLengthAnchorLabel(anchor: WallLengthAnchor): string {
  return anchor === "start"
    ? "Keeps start fixed · moves end"
    : "Keeps end fixed · moves start";
}

/** Stretch a wall to an exact length by moving ONE side; the anchored side stays put. */
export function setTypedWallLength(
  project: InteriorProject,
  wallId: string,
  lengthMm: number,
  anchor: WallLengthAnchor = DEFAULT_WALL_LENGTH_ANCHOR,
): InteriorProject {
  return setPlanWallLength(project, wallId, lengthMm, anchor);
}

export function describeTypedWallLengthChange(
  wall: WallEntity,
  nextLengthMm: number,
  anchor: WallLengthAnchor = DEFAULT_WALL_LENGTH_ANCHOR,
): string {
  const current = Math.round(wallLengthMm(wall));
  const next = Math.round(nextLengthMm);
  return `Wall ${current} → ${next} mm · ${wallLengthAnchorLabel(anchor)}`;
}
