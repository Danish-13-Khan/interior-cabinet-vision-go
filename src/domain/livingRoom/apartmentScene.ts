import type { InteriorProject } from "../interiorProject";
import { roomIdsUsingWall } from "../interiorProject/planTopology";
import { roomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import { resolveModelViewPose } from "./modelViewPresets";
import { createRoomSceneCache, type RoomSceneLookup } from "./roomSceneCache";
import { compileMaterials } from "./sceneCompiler";
import { wallSideFromCentre } from "./sceneCompilerRoom";
import {
  computeArchitectureBounds,
  computeCompiledSceneBounds,
  hashString,
  stableStringify,
} from "./sceneCompilerBounds";
import type { CompiledLivingRoomScene, CompiledSceneNode } from "./sceneTypes";
import {
  resolveLivingRoomColorManagement,
  resolveLivingRoomEnvironment,
  resolveLivingRoomStyle,
} from "./stylePresets";
import { sampleWindowOpenings } from "./windowKeyLight";

function isCeiling(node: CompiledSceneNode) {
  return node.metadata.surface === "ceiling";
}

/** Floors, objects and openings from every room. A shared wall is kept once. Ceilings stay out. */
export function apartmentSceneNodes(scenes: readonly CompiledLivingRoomScene[]): CompiledSceneNode[] {
  const seen = new Set<string>();
  const nodes: CompiledSceneNode[] = [];
  for (const scene of scenes) {
    for (const node of scene.nodes) {
      if (isCeiling(node) || seen.has(node.id)) continue;
      seen.add(node.id);
      nodes.push(node);
    }
  }
  return nodes;
}

function apartmentPlanCentre(project: InteriorProject) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const room of project.rooms) {
    const bounds = roomPlanViewBounds(project, room.id);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
    minZ = Math.min(minZ, bounds.minZ);
    maxZ = Math.max(maxZ, bounds.maxZ);
  }
  if (!Number.isFinite(minX)) return { x: 0, z: 0 };
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
}

/** Shared partitions stay "interior" so cutaway cannot drop them. Outside walls face the whole plan. */
function relabelApartmentWalls(project: InteriorProject, nodes: CompiledSceneNode[]) {
  const centre = apartmentPlanCentre(project);
  const sideByWall = new Map(project.walls.map((wall) => {
    const shared = roomIdsUsingWall(project, wall.id).length > 1;
    const side = shared ? "interior" : wallSideFromCentre(wall, centre);
    return [wall.id, side] as const;
  }));
  return nodes.map((node) => {
    const wallId = node.metadata.wallId;
    if (typeof wallId !== "string" || node.metadata.wallSide === undefined) return node;
    const wallSide = sideByWall.get(wallId);
    if (!wallSide || node.metadata.wallSide === wallSide) return node;
    return { ...node, metadata: { ...node.metadata, wallSide } };
  });
}

function sceneStyle(project: InteriorProject, scenes: readonly CompiledLivingRoomScene[]) {
  if (scenes[0]) return scenes[0].style;
  const stylePreset = resolveLivingRoomStyle(project);
  return {
    id: stylePreset.id,
    name: stylePreset.name,
    environment: resolveLivingRoomEnvironment(project),
    colorManagement: resolveLivingRoomColorManagement(project),
  };
}

function overviewCamera(project: InteriorProject, bounds: CompiledLivingRoomScene["bounds"]) {
  const pose = resolveModelViewPose({ bounds } as CompiledLivingRoomScene, "dollhouse");
  return {
    id: "apartment-overview",
    roomId: project.rooms[0]?.id ?? project.activeRoomId,
    name: "Whole apartment",
    position: pose.position,
    target: pose.target,
    fieldOfViewDegrees: pose.fieldOfViewDegrees,
    isDefault: true,
  };
}

/**
 * One scene for every room. Shared walls and their openings are emitted once.
 * Ceilings are omitted. Lights stay empty until the overview rig (8.2); preset
 * fill exists only on the hero room, so this view must not copy per-room lights.
 *
 * Each room compile still runs the classic adapter over the whole project for
 * that room's countertops (about 14 passes on a 3 BHK). Measure that in 8.4.
 */
export function compileApartmentScene(
  project: InteriorProject,
  sceneFor: RoomSceneLookup = createRoomSceneCache(project),
): CompiledLivingRoomScene {
  const scenes = project.rooms.map((room) => sceneFor(room.id));
  const nodes = relabelApartmentWalls(project, apartmentSceneNodes(scenes));
  const materials = compileMaterials(project);
  const lights: CompiledLivingRoomScene["lights"] = [];
  const bounds = computeCompiledSceneBounds(nodes);
  const cameras = [overviewCamera(project, bounds)];
  const style = sceneStyle(project, scenes);
  const architectureBounds = computeArchitectureBounds(nodes);
  const fingerprintSource = {
    nodes,
    materials,
    lights,
    cameras,
    style,
    lightingRecipeId: project.renderSettings.lightingRecipeId,
  };
  return {
    compilerVersion: 1,
    projectId: project.id,
    roomId: project.activeRoomId,
    units: "mm",
    nodes,
    materials,
    lights,
    cameras,
    lightingRecipeId: project.renderSettings.lightingRecipeId,
    windowOpenings: sampleWindowOpenings({
      walls: project.walls,
      openings: project.openings,
      roomCenterMm: architectureBounds.center,
    }),
    style,
    bounds,
    fingerprint: `apt-scene-v1-${hashString(stableStringify(fingerprintSource))}`,
    warnings: scenes.flatMap((scene) => scene.warnings).filter((warning, index, all) => all.indexOf(warning) === index),
  };
}
