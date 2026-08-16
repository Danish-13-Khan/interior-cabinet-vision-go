import type { OpeningEntity, WallEntity } from "../interiorProject";

export type RoomShellDimensions = {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  wallThicknessMm: number;
};

export type RoomShellIdFactory = (scope: "wall" | "opening", key: string) => string;
export type RoomOpeningSeed = Omit<OpeningEntity, "id" | "roomId" | "wallId"> & {
  key: string;
  wallSide: "back" | "right" | "front" | "left";
};

export type RoomShell = { walls: WallEntity[]; openings: OpeningEntity[] };

/** Creates a clockwise rectangular shell that any room preset can decorate. */
export function createRectangularRoomShell(args: {
  roomId: string;
  dimensions: RoomShellDimensions;
  wallMaterialId: string | null;
  openings?: readonly RoomOpeningSeed[];
  idFactory: RoomShellIdFactory;
}): RoomShell {
  const { roomId, dimensions, wallMaterialId, idFactory } = args;
  const x = dimensions.widthMm / 2;
  const z = dimensions.depthMm / 2;
  const edges = [
    ["back", { x: -x, z: -z }, { x, z: -z }],
    ["right", { x, z: -z }, { x, z }],
    ["front", { x, z }, { x: -x, z }],
    ["left", { x: -x, z }, { x: -x, z: -z }],
  ] as const;
  const walls = edges.map(([side, start, end]) => ({
    id: idFactory("wall", side),
    roomId,
    start,
    end,
    heightMm: dimensions.heightMm,
    thicknessMm: dimensions.wallThicknessMm,
    visible: true,
    materialId: wallMaterialId,
    extensions: { wallSide: side },
  }));
  const wallId = (side: RoomOpeningSeed["wallSide"]) =>
    walls.find((wall) => wall.extensions?.wallSide === side)!.id;
  const openings = (args.openings ?? []).map(({ key, wallSide, ...opening }) => ({
    ...opening,
    id: idFactory("opening", key),
    roomId,
    wallId: wallId(wallSide),
    extensions: opening.extensions ? { ...opening.extensions } : undefined,
  }));
  return { walls, openings };
}
