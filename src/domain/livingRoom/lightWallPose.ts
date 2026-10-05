import type { InteriorProject, LightEntity } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import { fixtureNumber } from "./lightFixtureProperties";
import type { PanelWallSide } from "./panelAttachment";
import { wallLength } from "./wallSegmentPlacement";

/** Inset at each end when a strip is fitted to its host wall. */
export const WALL_STRIP_END_MARGIN_MM = 20;

export type WallLightMount = {
  kind: "wall";
  hostWallId: string;
  /** Centre, along the oriented wall, same origin as panel `alongMm`. */
  alongMm: number;
  centerHeightMm: number;
  wallSide: PanelWallSide;
  fitHostWidth: boolean;
};

function roundDeg(value: number) {
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded) < 0.0005) return 0;
  return Math.abs(rounded) === 180 ? 180 : rounded;
}

/** Keep the fixture centre on the wall, using half its length as the margin. */
function clampCentre(wallLen: number, fixtureLen: number, alongMm: number) {
  if (fixtureLen >= wallLen) return wallLen / 2;
  const half = fixtureLen / 2;
  return Math.min(wallLen - half, Math.max(half, alongMm));
}

/**
 * Wall pose. Bodies emit along local −Z, so yaw aims −Z off the wall.
 * Cove adds X = 90 so that aim is upward (Euler order YXZ at render time).
 * Returns null when the host wall is not in the light's room.
 */
export function resolveWallLightPose(
  project: InteriorProject,
  light: LightEntity,
  mount: Omit<WallLightMount, "kind">,
): LightEntity | null {
  if (!light.roomId) return null;
  const stored = selectRoomWalls(project, light.roomId).find((wall) => wall.id === mount.hostWallId);
  if (!stored) return null;
  const wall = orientWallForRoom(project, light.roomId, stored);
  const length = wallLength(wall);
  if (length < 1) return null;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  let nx = -uz;
  let nz = ux;
  if (mount.wallSide === "exterior") {
    nx = -nx;
    nz = -nz;
  }
  const fitted = mount.fitHostWidth
    ? Math.max(20, length - 2 * WALL_STRIP_END_MARGIN_MM)
    : Math.max(20, fixtureNumber(light, "widthMm", 20));
  const along = clampCentre(length, fitted, mount.alongMm);
  const standOff = wall.thicknessMm / 2 + fixtureNumber(light, "depthMm", 20) / 2;
  const yaw = roundDeg((Math.atan2(-nx, -nz) * 180) / Math.PI);
  return {
    ...light,
    position: {
      x: wall.start.x + ux * along + nx * standOff,
      y: mount.centerHeightMm,
      z: wall.start.z + uz * along + nz * standOff,
    },
    rotation: { x: light.parameters.fixtureKind === "cove" ? 90 : 0, y: yaw, z: 0 },
    parameters: {
      ...light.parameters,
      hostWallId: mount.hostWallId,
      alongMm: along,
      centerHeightMm: mount.centerHeightMm,
      wallSide: mount.wallSide,
      fitHostWidth: mount.fitHostWidth,
      ...(mount.fitHostWidth ? { widthMm: fitted } : {}),
      attachmentMissing: false,
    },
  };
}
