import type {
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  WallEntity,
} from "../interiorProject";
import { clampOpeningVertical, polygonBounds, roomPlanPolygon, selectRoomOpenings, selectRoomWalls } from "../interiorProject";
import { compileWallHeightMm, isWallRaised } from "../interiorProject/wallRaise";
import { createWallGraphIndex, type WallGraphIndex } from "../interiorProject/wallGraph";
import { createProceduralRenderBinding } from "./renderAssetBindings";
import { compileOpeningNode, wallPoint } from "./sceneCompilerOpenings";
import { boxPrimitive } from "./scenePrimitives";
import { compileRoomLoopSurfaces } from "./sceneCompilerSurfaces";
import type { CompiledSceneNode } from "./sceneTypes";

export const FALLBACK_MATERIAL_ID = "compiled:fallback";
export const FLOOR_MATERIAL_ID = "compiled:floor-fallback";

/** Front/back/left/right from which side of a plan centre the wall's midpoint sits on. */
export function wallSideFromCentre(wall: WallEntity, centre: { x: number; z: number }) {
  const midX = (wall.start.x + wall.end.x) / 2;
  const midZ = (wall.start.z + wall.end.z) / 2;
  return Math.abs(wall.end.x - wall.start.x) >= Math.abs(wall.end.z - wall.start.z)
    ? (midZ < centre.z ? "back" : "front")
    : (midX < centre.x ? "left" : "right");
}

function outerWallSide(project: InteriorProject, room: InteriorRoomEntity, wall: WallEntity) {
  const stored = wall.extensions?.wallSide;
  if (typeof stored === "string" && stored !== "custom") return stored;
  const loop = project.loops.find((item) => item.id === room.outerLoopId);
  if (!loop?.wallUses.some((use) => use.wallId === wall.id)) return "custom";
  const polygon = roomPlanPolygon(project, room.id);
  const bounds = polygon ? polygonBounds(polygon.outer) : null;
  return wallSideFromCentre(wall, {
    x: bounds ? (bounds.minX + bounds.maxX) / 2 : 0,
    z: bounds ? (bounds.minZ + bounds.maxZ) / 2 : 0,
  });
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
      planTrace: !isWallRaised(wall),
    },
    renderBinding: createProceduralRenderBinding({ surface: materialId }),
  };
}

/**
 * How far a wall box runs past its node so a two-wall corner closes (roadmap S9):
 * half the thickness divided by tan(θ/2), which is t/2 at a right angle and 0
 * for a straight continuation. Capped so acute corners do not spike.
 */
export function wallCornerExtensionMm(index: WallGraphIndex, wall: WallEntity, nodeId: string | undefined): number {
  if (!nodeId) return 0;
  const incident = index.incidentWallIdsByNode.get(nodeId) ?? [];
  if (incident.length !== 2) return 0;
  const other = index.wallsById.get(incident.find((id) => id !== wall.id) ?? "");
  const node = index.nodesById.get(nodeId);
  if (!other || !node) return 0;
  const away = (item: WallEntity) => {
    const far = item.startNodeId === nodeId ? item.end : item.start;
    const dx = far.x - node.position.x;
    const dz = far.z - node.position.z;
    const length = Math.hypot(dx, dz) || 1;
    return { x: dx / length, z: dz / length };
  };
  const a = away(wall);
  const b = away(other);
  const theta = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.z * b.z)));
  if (theta > Math.PI - 1e-3) return 0;
  const halfTan = Math.tan(theta / 2);
  if (halfTan < 1e-6) return 0;
  return Math.min((wall.thicknessMm / 2) / halfTan, wall.thicknessMm * 2);
}

function compileWall(
  project: InteriorProject,
  room: InteriorRoomEntity,
  wall: WallEntity,
  openings: OpeningEntity[],
  index: WallGraphIndex,
) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  const materialId = wall.materialId ?? FALLBACK_MATERIAL_ID;
  const wallSide = outerWallSide(project, room, wall);
  const topMm = compileWallHeightMm(wall);
  const startExtension = wallCornerExtensionMm(index, wall, wall.startNodeId);
  const endExtension = wallCornerExtensionMm(index, wall, wall.endNodeId);
  if (!isWallRaised(wall)) {
    const trace = wallSegment(wall, `${wall.id}:trace`, -startExtension, length + endExtension, 0, topMm, materialId, wallSide);
    return trace ? [trace] : [];
  }
  const nodes: CompiledSceneNode[] = [];
  let cursor = -startExtension;
  const sorted = [...openings]
    .filter((opening) => opening.wallId === wall.id)
    .sort((a, b) => a.offsetMm - b.offsetMm);
  for (const opening of sorted) {
    const start = Math.max(cursor, Math.min(length, opening.offsetMm));
    const end = Math.max(start, Math.min(length, opening.offsetMm + opening.widthMm));
    const before = wallSegment(wall, `${wall.id}:before:${opening.id}`, cursor, start, 0, topMm, materialId, wallSide);
    if (before) nodes.push(before);
    const vertical = clampOpeningVertical(opening, topMm);
    const below = wallSegment(
      wall, `${wall.id}:below:${opening.id}`, start, end, 0, vertical.sillHeightMm, materialId, wallSide,
    );
    if (below) nodes.push(below);
    const openingTop = vertical.sillHeightMm + vertical.heightMm;
    const above = wallSegment(wall, `${wall.id}:above:${opening.id}`, start, end, openingTop, topMm, materialId, wallSide);
    if (above) nodes.push(above);
    cursor = Math.max(cursor, end);
  }
  const remainder = wallSegment(wall, `${wall.id}:remainder`, cursor, length + endExtension, 0, topMm, materialId, wallSide);
  if (remainder) nodes.push(remainder);
  return nodes;
}

export function compileLivingRoomArchitecture(
  project: InteriorProject,
): CompiledSceneNode[] {
  const room = project.rooms.find((candidate) => candidate.id === project.activeRoomId);
  if (!room) return [];
  const index = createWallGraphIndex(project);
  return [
    ...compileRoomLoopSurfaces(project, room),
    ...selectRoomWalls(project, room.id)
      .filter((wall) => wall.visible)
      .flatMap((wall) => compileWall(project, room, wall, project.openings.filter((opening) => opening.extensions?.layerVisible !== false), index)),
    ...selectRoomOpenings(project, room.id)
      .filter((opening) => opening.extensions?.layerVisible !== false)
      .map((opening) => {
        const wall = project.walls.find((candidate) => candidate.id === opening.wallId);
        if (!wall || !isWallRaised(wall)) return null;
        const vertical = clampOpeningVertical(opening, compileWallHeightMm(wall));
        return vertical.heightMm > 0
          ? compileOpeningNode({ ...opening, ...vertical }, wall)
          : null;
      })
      .filter((node): node is CompiledSceneNode => node !== null),
  ];
}
