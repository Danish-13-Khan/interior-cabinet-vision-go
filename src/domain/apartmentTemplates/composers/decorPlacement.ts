import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addWallPanel } from "../../livingRoom/panelCommands";
import { getWallDecorationPreset } from "../../livingRoom/wallDecorations";
import type { WallSide } from "../types";
import { fixedAlongToRoomAlongMm, freePiecesOnSide } from "./wallPieces";

/**
 * Wall decoration on a free piece of `side`: sized to the piece and centred as
 * close to the room centre as the piece allows, so it never covers a door,
 * window or arch. Decor may sit behind hosted furniture (TV unit, vanity).
 */
export function addDecorOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  presetId: string,
  objectId: string,
  minWidthMm = 400,
): InteriorProject {
  const preset = getWallDecorationPreset(presetId);
  if (!preset) return project;
  const active = project.activeRoomId === roomId ? project : { ...project, activeRoomId: roomId };
  const piece = freePiecesOnSide(active, roomId, side, minWidthMm, { avoidObjects: false })[0];
  if (!piece) return project;
  const size = preset.size(piece.wall);
  const widthMm = Math.min(size.widthMm, piece.lengthMm);
  const bounds = roomPlanViewBounds(active, roomId);
  const horizontal = Math.abs(piece.wall.end.x - piece.wall.start.x) >= Math.abs(piece.wall.end.z - piece.wall.start.z);
  const centreAlong = horizontal
    ? Math.abs(bounds.centerX - piece.wall.start.x)
    : Math.abs(bounds.centerZ - piece.wall.start.z);
  const lo = piece.startAlongMm + widthMm / 2;
  const hi = piece.startAlongMm + piece.lengthMm - widthMm / 2;
  const centre = Math.max(lo, Math.min(hi, centreAlong));
  const alongMm = fixedAlongToRoomAlongMm(active, roomId, piece.wall, centre - widthMm / 2, widthMm) + widthMm / 2;
  return addWallPanel(active, piece.wall.id, {
    id: objectId,
    catalogItemId: preset.catalogItemId,
    dimensions: { ...size, widthMm },
    floorOffsetMm: preset.floorOffsetMm,
    alongMm,
  });
}
