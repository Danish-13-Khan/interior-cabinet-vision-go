import { arrangeCabinetRun } from "../../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import { seedCabinet } from "../../catalog/kitchenTemplateShared";
import { roomPlanViewBounds, type InteriorProject, type WallEntity } from "../../interiorProject";
import type { KitchenComposeOptions, WallSide } from "../types";
import { applyCabinetFrontOptions } from "./cabinetOptions";
import { oppositeSide } from "./helpers";
import { fixedAlongToRoomAlongMm, freePiecesOnSide, pointAlongWall } from "./wallPieces";

/** L leg starts this far from the corner so it clears the primary run depth. */
export const L_CORNER_CLEARANCE_MM = 600;
const LEG_BASE_WIDTH_MM = 900;
const MIN_LEG_BASES = 2;

/** Thrown when a template asks for an L / parallel second run its room cannot hold. */
export class KitchenLegDoesNotFitError extends Error {}

function distanceToLine(point: { x: number; z: number }, wall: WallEntity): number {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz) || 1;
  return Math.abs((point.x - wall.start.x) * dz - (point.z - wall.start.z) * dx) / length;
}

/**
 * Second kitchen run: L on a perpendicular wall (clear of the corner the
 * primary run occupies, whichever end that is) or parallel on the opposite
 * wall. Fails loudly instead of silently dropping the run.
 */
export function composeSecondaryLeg(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  primarySide: WallSide,
  primaryWall: WallEntity,
  idFactory: LivingRoomIdFactory,
  layout: "L" | "parallel",
  options: KitchenComposeOptions,
): InteriorProject {
  if (layout === "parallel" && side !== oppositeSide(primarySide)) {
    throw new KitchenLegDoesNotFitError(
      `parallel kitchen in ${roomId}: second run must face the ${primarySide} run (got ${side})`,
    );
  }
  if (layout === "L" && (side === primarySide || side === oppositeSide(primarySide))) {
    throw new KitchenLegDoesNotFitError(`L kitchen in ${roomId}: ${side} is not perpendicular to ${primarySide}`);
  }
  const minimum = MIN_LEG_BASES * LEG_BASE_WIDTH_MM;
  // A piece whose near end sits inside the primary run's depth must start clear of it.
  const fit = freePiecesOnSide(project, roomId, side, minimum).map((piece) => {
    const lo = pointAlongWall(piece.wall, piece.startAlongMm);
    const hi = pointAlongWall(piece.wall, piece.startAlongMm + piece.lengthMm);
    const dLo = distanceToLine(lo, primaryWall);
    const dHi = distanceToLine(hi, primaryWall);
    const cornerAtStart = dLo <= dHi;
    // Distances are to the primary wall centreline; its half thickness eats into the run depth.
    const clearance = L_CORNER_CLEARANCE_MM + primaryWall.thicknessMm / 2;
    const shift = layout === "L" ? Math.max(0, clearance - Math.min(dLo, dHi)) : 0;
    return { piece, cornerAtStart, shift };
  }).find((entry) => entry.piece.lengthMm - entry.shift + 0.5 >= minimum);
  if (!fit) {
    throw new KitchenLegDoesNotFitError(
      `${layout} kitchen in ${roomId}: no free ${minimum} mm on the ${side} wall for the second run`,
    );
  }
  const { piece, cornerAtStart, shift } = fit;
  const maxBases = layout === "L" ? 2 : 3;
  const count = Math.min(maxBases, Math.floor((piece.lengthMm - shift + 0.5) / LEG_BASE_WIDTH_MM));
  const bounds = roomPlanViewBounds(project, roomId);
  const ids = Array.from({ length: count }, (_, index) => idFactory("object", `${roomId}-leg-${index}`));
  const seeds = ids.map((id, index) => applyCabinetFrontOptions(
    seedCabinet(roomId, "frameless-standard-base", id, {
      x: bounds.centerX + index * 100, y: 0, z: bounds.centerZ + index * 100,
    }),
    options,
  ));
  const next = { ...project, objects: [...project.objects, ...seeds] };
  const legWidth = seeds.reduce((sum, seed) => sum + seed.dimensions.widthMm, 0);
  const slack = Math.max(0, piece.lengthMm - legWidth);
  const clear = Math.min(shift, slack);
  // Parallel: centred. L: pushed to the corner end of the piece, clear of the primary run.
  const fixedStart = layout === "parallel"
    ? piece.startAlongMm + slack / 2
    : cornerAtStart ? piece.startAlongMm + clear : piece.startAlongMm + slack - clear;
  const startAlong = fixedAlongToRoomAlongMm(next, roomId, piece.wall, fixedStart, legWidth);
  return arrangeCabinetRun(next, ids, piece.wall.id, { alignment: "start", startAlongMm: startAlong, gapMm: 0 });
}
