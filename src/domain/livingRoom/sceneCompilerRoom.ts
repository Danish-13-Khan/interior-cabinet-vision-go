import type {
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  WallEntity,
} from "../interiorProject";
import { polygonBounds, roomPlanPolygon, selectRoomOpenings, selectRoomWalls } from "../interiorProject";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { compileOpeningNode, wallPoint } from "./sceneCompilerOpenings";
import { boxPrimitive } from "./scenePrimitives";
import { compileRoomLoopSurfaces } from "./sceneCompilerSurfaces";
import type { CompiledSceneNode } from "./sceneTypes";

export const FALLBACK_MATERIAL_ID = "compiled:fallback";
export const FLOOR_MATERIAL_ID = "compiled:floor-fallback";

function outerWallSide(project: InteriorProject, room: InteriorRoomEntity, wall: WallEntity) {
  const stored = wall.extensions?.wallSide;
  if (typeof stored === "string" && stored !== "custom") return stored;
  const loop = project.loops.find((item) => item.id === room.outerLoopId);
  if (!loop?.wallUses.some((use) => use.wallId === wall.id)) return "custom";
  const polygon = roomPlanPolygon(project, room.id);
  const bounds = polygon ? polygonBounds(polygon.outer) : null;
  const centerX = bounds ? (bounds.minX + bounds.maxX) / 2 : 0;
  const centerZ = bounds ? (bounds.minZ + bounds.maxZ) / 2 : 0;
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.z + wall.end.z) / 2;
  return Math.abs(wall.end.x - wall.start.x) >= Math.abs(wall.end.z - wall.start.z)
    ? (midZ < centerZ ? "back" : "front")
    : (midX < centerX ? "left" : "right");
}

function wallSegment(
  wall: WallEntity,
  id: string,
  fromMm: number,
  toMm: number,
  bottomMm: number,
  topMm: number,
  materialId: string,
  wallSide: string,
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
      wallSide,
    },
    renderBinding: createProceduralRenderBinding({ surface: materialId }),
  };
}

function compileWall(project: InteriorProject, room: InteriorRoomEntity, wall: WallEntity, openings: OpeningEntity[]) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  const materialId = wall.materialId ?? FALLBACK_MATERIAL_ID;
  const wallSide = outerWallSide(project, room, wall);
  const nodes: CompiledSceneNode[] = [];
  let cursor = 0;
  const sorted = [...openings]
    .filter((opening) => opening.wallId === wall.id)
    .sort((a, b) => a.offsetMm - b.offsetMm);
  for (const opening of sorted) {
    const start = Math.max(cursor, Math.min(length, opening.offsetMm));
    const end = Math.max(start, Math.min(length, opening.offsetMm + opening.widthMm));
    const before = wallSegment(wall, `${wall.id}:before:${opening.id}`, cursor, start, 0, wall.heightMm, materialId, wallSide);
    if (before) nodes.push(before);
    const below = wallSegment(wall, `${wall.id}:below:${opening.id}`, start, end, 0, opening.sillHeightMm, materialId, wallSide);
    if (below) nodes.push(below);
    const openingTop = Math.min(wall.heightMm, opening.sillHeightMm + opening.heightMm);
    const above = wallSegment(wall, `${wall.id}:above:${opening.id}`, start, end, openingTop, wall.heightMm, materialId, wallSide);
    if (above) nodes.push(above);
    cursor = Math.max(cursor, end);
  }
  const remainder = wallSegment(wall, `${wall.id}:remainder`, cursor, length, 0, wall.heightMm, materialId, wallSide);
  if (remainder) nodes.push(remainder);
  return nodes;
}

export function compileLivingRoomArchitecture(
  project: InteriorProject,
): CompiledSceneNode[] {
  const room = project.rooms.find((candidate) => candidate.id === project.activeRoomId);
  if (!room) return [];
  return [
    ...compileRoomLoopSurfaces(project, room),
    ...selectRoomWalls(project, room.id)
      .filter((wall) => wall.visible)
      .flatMap((wall) => compileWall(project, room, wall, project.openings.filter((opening) => opening.extensions?.layerVisible !== false))),
    ...selectRoomOpenings(project, room.id)
      .filter((opening) => opening.extensions?.layerVisible !== false)
      .map((opening) => {
        const wall = project.walls.find((candidate) => candidate.id === opening.wallId);
        return wall ? compileOpeningNode(opening, wall) : null;
      })
      .filter((node): node is CompiledSceneNode => node !== null),
  ];
}
