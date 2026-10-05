import {
  createWallSegment,
  roomPlanViewBounds,
  type InteriorProject,
  type Point2Mm,
} from "../interiorProject";
import type { ApartmentSplit } from "./types";

export type CellRoomMap = Map<string, string>;

function cutEndpoints(
  bounds: ReturnType<typeof roomPlanViewBounds>,
  axis: "x" | "z",
  atMm: number,
): { start: Point2Mm; end: Point2Mm } {
  if (axis === "x") {
    return {
      start: { x: atMm, z: bounds.minZ },
      end: { x: atMm, z: bounds.maxZ },
    };
  }
  return {
    start: { x: bounds.minX, z: atMm },
    end: { x: bounds.maxX, z: atMm },
  };
}

function assignCells(
  project: InteriorProject,
  roomA: string,
  roomB: string,
  axis: "x" | "z",
  cells: [string, string],
  map: CellRoomMap,
) {
  const a = roomPlanViewBounds(project, roomA);
  const b = roomPlanViewBounds(project, roomB);
  const centerA = axis === "x" ? a.centerX : a.centerZ;
  const centerB = axis === "x" ? b.centerX : b.centerZ;
  if (centerA <= centerB) {
    map.set(cells[0], roomA);
    map.set(cells[1], roomB);
  } else {
    map.set(cells[0], roomB);
    map.set(cells[1], roomA);
  }
}

/** Apply one guillotine split to the room currently bound to `split.inCell`. */
export function applyGuillotineSplit(
  project: InteriorProject,
  split: ApartmentSplit,
  cells: CellRoomMap,
  internalWallMm: number,
): InteriorProject {
  const roomId = cells.get(split.inCell);
  if (!roomId) {
    throw new Error(`Unknown cell "${split.inCell}" for split "${split.key}"`);
  }
  const bounds = roomPlanViewBounds(project, roomId);
  const { start, end } = cutEndpoints(bounds, split.axis, split.atMm);
  const beforeIds = new Set(project.rooms.map((room) => room.id));
  const next = createWallSegment(
    { ...project, activeRoomId: roomId },
    {
      roomId,
      start,
      end,
      kind: "wall",
      thicknessMm: internalWallMm,
      raised: true,
    },
  );
  if (next.rooms.length <= project.rooms.length) {
    throw new Error(`Guillotine split "${split.key}" did not create a new room`);
  }
  const newRoomId = next.rooms.find((room) => !beforeIds.has(room.id))!.id;
  cells.delete(split.inCell);
  assignCells(next, roomId, newRoomId, split.axis, split.cells, cells);
  return withCutThickness(next, internalWallMm);
}

/**
 * splitRoomByWall stamps the room's (external) thickness on every cut; apply
 * the spec's internal partition thickness to all room-split walls instead.
 * (Wall ids are recycled across splits, so match by structural kind.)
 */
function withCutThickness(
  next: InteriorProject,
  internalWallMm: number,
): InteriorProject {
  return {
    ...next,
    walls: next.walls.map((wall) =>
      wall.extensions?.structuralKind === "room-split"
        && wall.thicknessMm !== internalWallMm
        ? { ...wall, thicknessMm: internalWallMm }
        : wall),
  };
}
