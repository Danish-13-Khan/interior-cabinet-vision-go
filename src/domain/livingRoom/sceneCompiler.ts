import type {
  InteriorProject,
  OpeningEntity,
  Point3Mm,
  WallEntity,
} from "../interiorProject";
import { compileLivingRoomObjectNode } from "./sceneAdapters";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { boxPrimitive } from "./scenePrimitives";
import type {
  CompiledLivingRoomScene,
  CompiledMaterial,
  CompiledSceneBounds,
  CompiledSceneNode,
} from "./sceneTypes";

const FALLBACK_MATERIAL_ID = "compiled:fallback";
const FLOOR_MATERIAL_ID = "compiled:floor-fallback";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function wallPoint(wall: WallEntity, distanceMm: number) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  return {
    x: wall.start.x + (dx / length) * distanceMm,
    z: wall.start.z + (dz / length) * distanceMm,
  };
}

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
    )],
    placeholder: false,
    metadata: {
      role: "wall",
      wallId: wall.id,
      wallSide: String(wall.extensions?.wallSide ?? "custom"),
    },
  };
}

function compileWall(
  wall: WallEntity,
  openings: OpeningEntity[],
): CompiledSceneNode[] {
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

function compileOpening(
  opening: OpeningEntity,
  wall: WallEntity,
): CompiledSceneNode | null {
  if (opening.kind === "opening") return null;
  const midpoint = wallPoint(wall, opening.offsetMm + opening.widthMm / 2);
  const rotationY = -Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x,
  ) * 180 / Math.PI;
  const materialId = opening.kind === "window"
    ? LIVING_ROOM_MATERIAL_IDS.clearGlass
    : LIVING_ROOM_MATERIAL_IDS.naturalOak;
  return {
    id: `opening-node:${opening.id}`,
    name: opening.kind === "window" ? "Window" : "Door",
    sourceObjectId: null,
    adapterId: `room-${opening.kind}-v1`,
    positionMm: { x: midpoint.x, y: 0, z: midpoint.z },
    rotationDegrees: { x: 0, y: rotationY, z: 0 },
    primitives: [boxPrimitive(
      opening.kind,
      {
        width: opening.widthMm - 24,
        height: opening.heightMm - 24,
        depth: opening.kind === "window" ? 12 : 42,
      },
      {
        x: 0,
        y: opening.sillHeightMm + opening.heightMm / 2,
        z: 0,
      },
      materialId,
      { castShadow: opening.kind === "door" },
    )],
    placeholder: false,
    metadata: {
      role: "opening",
      openingId: opening.id,
      openingKind: opening.kind,
      wallSide: String(wall.extensions?.wallSide ?? "custom"),
    },
  };
}

function compileRoomNodes(project: InteriorProject) {
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
      {
        width: room.dimensions.widthMm,
        height: 40,
        depth: room.dimensions.depthMm,
      },
      { x: 0, y: -20, z: 0 },
      floorMaterialId,
      { castShadow: false },
    )],
    placeholder: false,
    metadata: { role: "floor" },
  };
  return [
    floor,
    ...project.walls
      .filter((wall) => wall.roomId === room.id && wall.visible)
      .flatMap((wall) => compileWall(wall, project.openings)),
    ...project.openings
      .filter((opening) => opening.roomId === room.id)
      .map((opening) => {
        const wall = project.walls.find((candidate) => candidate.id === opening.wallId);
        return wall ? compileOpening(opening, wall) : null;
      })
      .filter((node): node is CompiledSceneNode => node !== null),
  ];
}

function compileMaterials(project: InteriorProject): CompiledMaterial[] {
  return [
    ...project.materials.map((material) => ({
      id: material.id,
      name: material.name,
      kind: material.kind,
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness,
      opacity: material.opacity,
    })),
    {
      id: FALLBACK_MATERIAL_ID,
      name: "Safe Placeholder",
      kind: "custom" as const,
      color: "#d29a44",
      roughness: 0.72,
      metalness: 0,
      opacity: 1,
    },
    {
      id: FLOOR_MATERIAL_ID,
      name: "Floor Fallback",
      kind: "wood" as const,
      color: "#b98a58",
      roughness: 0.68,
      metalness: 0,
      opacity: 1,
    },
  ];
}

function rotateLocalPoint(point: Point3Mm, rotationY: number) {
  const radians = rotationY * Math.PI / 180;
  return {
    x: point.x * Math.cos(radians) + point.z * Math.sin(radians),
    z: -point.x * Math.sin(radians) + point.z * Math.cos(radians),
  };
}

function computeBounds(nodes: CompiledSceneNode[]): CompiledSceneBounds {
  const min: Point3Mm = { x: Infinity, y: Infinity, z: Infinity };
  const max: Point3Mm = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const node of nodes) {
    for (const primitive of node.primitives) {
      const width = primitive.kind === "box"
        ? primitive.sizeMm.width
        : primitive.radiusBottomMm * 2;
      const depth = primitive.kind === "box"
        ? primitive.sizeMm.depth
        : primitive.radiusBottomMm * 2;
      const height = primitive.kind === "box" ? primitive.sizeMm.height : primitive.heightMm;
      const rotation = node.rotationDegrees.y + primitive.rotationDegrees.y;
      const radians = rotation * Math.PI / 180;
      const halfX = Math.abs(Math.cos(radians)) * width / 2 + Math.abs(Math.sin(radians)) * depth / 2;
      const halfZ = Math.abs(Math.sin(radians)) * width / 2 + Math.abs(Math.cos(radians)) * depth / 2;
      const local = rotateLocalPoint(primitive.positionMm, node.rotationDegrees.y);
      const center = {
        x: node.positionMm.x + local.x,
        y: node.positionMm.y + primitive.positionMm.y,
        z: node.positionMm.z + local.z,
      };
      min.x = Math.min(min.x, center.x - halfX);
      min.y = Math.min(min.y, center.y - height / 2);
      min.z = Math.min(min.z, center.z - halfZ);
      max.x = Math.max(max.x, center.x + halfX);
      max.y = Math.max(max.y, center.y + height / 2);
      max.z = Math.max(max.z, center.z + halfZ);
    }
  }
  if (!Number.isFinite(min.x)) {
    min.x = min.y = min.z = 0;
    max.x = max.y = max.z = 0;
  }
  return {
    min,
    max,
    center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
    size: { widthMm: max.x - min.x, heightMm: max.y - min.y, depthMm: max.z - min.z },
  };
}

/** Compile canonical project data without importing React or Three.js. */
export function compileLivingRoomScene(
  project: InteriorProject,
): CompiledLivingRoomScene {
  const roomId = project.activeRoomId;
  const objectNodes = project.objects
    .filter((object) => object.roomId === roomId)
    .map(compileLivingRoomObjectNode);
  const nodes = [...compileRoomNodes(project), ...objectNodes];
  const materials = compileMaterials(project);
  const lights = project.lights.filter((light) => light.roomId === null || light.roomId === roomId);
  const cameras = project.cameras.filter((camera) => camera.roomId === roomId);
  const fingerprintSource = { roomId, nodes, materials, lights, cameras };
  return {
    compilerVersion: 1,
    projectId: project.id,
    roomId,
    units: "mm",
    nodes,
    materials,
    lights,
    cameras,
    bounds: computeBounds(nodes),
    fingerprint: `lr-scene-v1-${hashString(stableStringify(fingerprintSource))}`,
    warnings: objectNodes
      .filter((node) => node.placeholder)
      .map((node) => `${node.name} uses a safe placeholder because ${String(node.metadata.catalogItemId)} has no scene adapter.`),
  };
}
