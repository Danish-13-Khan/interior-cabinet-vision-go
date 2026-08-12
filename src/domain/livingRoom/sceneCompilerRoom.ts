import type {
  InteriorProject,
  OpeningEntity,
  WallEntity,
} from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { compileOpeningNode, wallPoint } from "./sceneCompilerOpenings";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledSceneNode } from "./sceneTypes";

export const FALLBACK_MATERIAL_ID = "compiled:fallback";
export const FLOOR_MATERIAL_ID = "compiled:floor-fallback";

function wallSegment(
  wall: WallEntity,
  id: string,
  fromMm: number,
  toMm: number,
  bottomMm: number,
  topMm: number,
  materialId: string,
): CompiledSceneNode | null {
  const width = toMm - fromMm;
  const height = topMm - bottomMm;
  if (width <= 0 || height <= 0) return null;
  const midpoint = wallPoint(wall, (fromMm + toMm) / 2);
  const rotationY = -Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x,
  ) * 180 / Math.PI;
  return {
    id,
    name: "Wall",
    sourceObjectId: null,
    adapterId: "room-wall-v1",
    positionMm: { x: midpoint.x, y: 0, z: midpoint.z },
    rotationDegrees: { x: 0, y: rotationY, z: 0 },
    primitives: [boxPrimitive(
      "wall-panel",
      { width, height, depth: wall.thicknessMm },
      { x: 0, y: bottomMm + height / 2, z: 0 },
      materialId,
      { castShadow: false },
    )],
    placeholder: false,
    metadata: {
      role: "wall",
      wallId: wall.id,
      wallSide: String(wall.extensions?.wallSide ?? "custom"),
    },
    renderBinding: createProceduralRenderBinding({ surface: materialId }),
  };
}

function compileWall(wall: WallEntity, openings: OpeningEntity[]) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  const materialId = wall.materialId ?? FALLBACK_MATERIAL_ID;
  const nodes: CompiledSceneNode[] = [];
  let cursor = 0;
  const sorted = [...openings]
    .filter((opening) => opening.wallId === wall.id)
    .sort((a, b) => a.offsetMm - b.offsetMm);
  for (const opening of sorted) {
    const start = Math.max(cursor, Math.min(length, opening.offsetMm));
    const end = Math.max(start, Math.min(length, opening.offsetMm + opening.widthMm));
    const before = wallSegment(wall, `${wall.id}:before:${opening.id}`, cursor, start, 0, wall.heightMm, materialId);
    if (before) nodes.push(before);
    const below = wallSegment(wall, `${wall.id}:below:${opening.id}`, start, end, 0, opening.sillHeightMm, materialId);
    if (below) nodes.push(below);
    const openingTop = Math.min(wall.heightMm, opening.sillHeightMm + opening.heightMm);
    const above = wallSegment(wall, `${wall.id}:above:${opening.id}`, start, end, openingTop, wall.heightMm, materialId);
    if (above) nodes.push(above);
    cursor = Math.max(cursor, end);
  }
  const remainder = wallSegment(wall, `${wall.id}:remainder`, cursor, length, 0, wall.heightMm, materialId);
  if (remainder) nodes.push(remainder);
  return nodes;
}

export function compileLivingRoomArchitecture(
  project: InteriorProject,
): CompiledSceneNode[] {
  const room = project.rooms.find((candidate) => candidate.id === project.activeRoomId);
  if (!room) return [];
  const floorMaterialId = typeof room.extensions?.floorMaterialId === "string"
    ? room.extensions.floorMaterialId
    : FLOOR_MATERIAL_ID;
  const floor: CompiledSceneNode = {
    id: `room-floor:${room.id}`,
    name: `${room.name} Floor`,
    sourceObjectId: null,
    adapterId: "room-floor-v1",
    positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [boxPrimitive(
      "floor",
      { width: room.dimensions.widthMm, height: 40, depth: room.dimensions.depthMm },
      { x: 0, y: -20, z: 0 },
      floorMaterialId,
      { castShadow: false },
    )],
    placeholder: false,
    metadata: { role: "floor" },
    renderBinding: createProceduralRenderBinding({ surface: floorMaterialId }),
  };
  const paint = LIVING_ROOM_MATERIAL_IDS.ceilingPaint;
  const architecture: CompiledSceneNode = {
    id: `room-architecture:${room.id}`,
    name: `${room.name} Architecture`,
    sourceObjectId: null,
    adapterId: "room-architecture-v1",
    positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [
      boxPrimitive("ceiling", { width: room.dimensions.widthMm, height: 24, depth: room.dimensions.depthMm }, { x: 0, y: room.dimensions.heightMm + 12, z: 0 }, paint, { castShadow: false }),
      boxPrimitive("skirting-back", { width: room.dimensions.widthMm - 220, height: 90, depth: 18 }, { x: 0, y: 45, z: -room.dimensions.depthMm / 2 + room.wallThicknessMm / 2 + 10 }, paint),
      boxPrimitive("skirting-left", { width: 18, height: 90, depth: room.dimensions.depthMm - 220 }, { x: -room.dimensions.widthMm / 2 + room.wallThicknessMm / 2 + 10, y: 45, z: 0 }, paint),
      boxPrimitive("skirting-right", { width: 18, height: 90, depth: room.dimensions.depthMm - 220 }, { x: room.dimensions.widthMm / 2 - room.wallThicknessMm / 2 - 10, y: 45, z: 0 }, paint),
    ],
    placeholder: false,
    metadata: { role: "architecture" },
    renderBinding: createProceduralRenderBinding({ surface: paint }),
  };
  return [
    floor,
    architecture,
    ...project.walls
      .filter((wall) => wall.roomId === room.id && wall.visible)
      .flatMap((wall) => compileWall(wall, project.openings)),
    ...project.openings
      .filter((opening) => opening.roomId === room.id)
      .map((opening) => {
        const wall = project.walls.find((candidate) => candidate.id === opening.wallId);
        return wall ? compileOpeningNode(opening, wall) : null;
      })
      .filter((node): node is CompiledSceneNode => node !== null),
  ];
}
