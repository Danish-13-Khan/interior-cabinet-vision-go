import { CABINET_WIDTH_STEP_MM, type CabinetConfig } from "../../cabinetDimensions";
import { CABINET_PLANNING_EXTENSION, readPlanningExtension } from "../../cabinetIdentity";
import { orientWallForRoom, type InteriorObjectEntity, type InteriorProject } from "../../interiorProject";
import { cabinetFromObject } from "../../interiorProject/cabinetAdapterCabinets";
import { createLivingRoomObject } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import { arrangeCabinetRun } from "../../livingRoom/wardrobePlacement";
import { applyCabinetFrontOptions, type CabinetFrontPatch } from "./cabinetOptions";
import { placeCabinetOnWall } from "./helpers";
import { fixedAlongToRoomAlongMm, type FreeWallPiece } from "./wallPieces";

/** Hinged almirah carcass limit (`frameless-standard-almirah`, manufacturing limits); sliding allows 900–2400. */
export const HINGED_WARDROBE_MODULE_MAX_MM = 900;

/**
 * Even split into the fewest modules of at most 900 mm, on the 10 mm width step:
 * 1800 → 900 + 900, 2100 → 700 × 3, 1500 → 750 × 2. Any sub-step remainder goes
 * to the last module so the run still adds up to the requested width.
 */
export function hingedWardrobeModuleWidths(totalMm: number): number[] {
  const count = Math.max(1, Math.ceil(totalMm / HINGED_WARDROBE_MODULE_MAX_MM - 1e-9));
  const step = CABINET_WIDTH_STEP_MM;
  const base = Math.floor(totalMm / count / step) * step;
  const widths = Array.from({ length: count }, () => base);
  let rest = totalMm - base * count;
  for (let index = 0; rest >= step && index < count; index += 1, rest -= step) widths[index]! += step;
  widths[count - 1]! += rest;
  return widths;
}

/** Turns end panels off on the sides that butt against a neighbouring module (outer ends keep the default). */
function withInnerEndPanelsOff(object: InteriorObjectEntity, left: boolean, right: boolean): InteriorObjectEntity {
  const planning = readPlanningExtension(object.extensions);
  const config = (planning?.config as CabinetConfig | undefined) ?? cabinetFromObject(object)?.config;
  if (!config) return object;
  const leftEndPanel = left && Boolean(config.leftEndPanel ?? config.composition?.endPanels.left);
  const rightEndPanel = right && Boolean(config.rightEndPanel ?? config.composition?.endPanels.right);
  const composition = config.composition
    ? { ...config.composition, endPanels: { left: leftEndPanel, right: rightEndPanel } }
    : undefined;
  const next: CabinetConfig = { ...config, leftEndPanel, rightEndPanel, ...(composition ? { composition } : {}) };
  return {
    ...object,
    extensions: { ...object.extensions, [CABINET_PLANNING_EXTENSION]: { ...planning, config: next } },
  };
}

export type WallWardrobeArgs = {
  roomId: string;
  piece: FreeWallPiece;
  widthMm: number;
  /** Fixed-wall offset of the wardrobe's left edge (from the free piece). */
  startAlongMm: number;
  idFactory: LivingRoomIdFactory;
  front: CabinetFrontPatch;
  position: { x: number; z: number };
};

/**
 * Wall wardrobe on a free piece. Sliding stays one carcass (900–2400 mm). A hinged
 * wardrobe wider than 900 mm becomes a run of almirah modules (≤ 900 each, see
 * `hingedWardrobeModuleWidths`) arranged with `arrangeCabinetRun` like kitchen bases,
 * each carrying the same front options; the first keeps the `<room>-wardrobe` id.
 */
export function placeWallWardrobe(project: InteriorProject, args: WallWardrobeArgs): InteriorProject {
  const { roomId, piece, widthMm, idFactory, front } = args;
  const sliding = front.wardrobeDoors === "sliding";
  const widths = sliding ? [widthMm] : hingedWardrobeModuleWidths(widthMm);
  const ids = widths.map((_, index) => idFactory("object", `${roomId}-wardrobe${index ? `-${index + 1}` : ""}`));
  let next = project;
  let cursor = args.startAlongMm;
  widths.forEach((moduleWidth, index) => {
    let seed = createLivingRoomObject("living:wardrobe-wall", {
      id: ids[index]!, roomId, position: { x: args.position.x, y: 0, z: args.position.z },
    });
    seed = applyCabinetFrontOptions({ ...seed, dimensions: { ...seed.dimensions, widthMm: moduleWidth } }, front);
    next = placeCabinetOnWall(next, seed, piece.wall, cursor + moduleWidth / 2);
    cursor += moduleWidth;
  });
  if (ids.length < 2) return next;
  const startAlong = fixedAlongToRoomAlongMm(next, roomId, piece.wall, args.startAlongMm, widthMm);
  next = arrangeCabinetRun(next, ids, piece.wall.id, { alignment: "start", startAlongMm: startAlong, gapMm: 0 });
  // Cabinet local +x runs along the room-oriented wall, so order modules along it.
  const stored = next.walls.find((wall) => wall.id === piece.wall.id) ?? piece.wall;
  const wall = orientWallForRoom(next, roomId, stored);
  const along = (object: InteriorObjectEntity) =>
    (object.position.x - wall.start.x) * (wall.end.x - wall.start.x)
    + (object.position.z - wall.start.z) * (wall.end.z - wall.start.z);
  const order = next.objects.filter((object) => ids.includes(object.id)).sort((a, b) => along(a) - along(b));
  const patched = new Map(order.map((object, index) => [
    object.id, withInnerEndPanelsOff(object, index === 0, index === order.length - 1),
  ]));
  return { ...next, objects: next.objects.map((object) => patched.get(object.id) ?? object) };
}
