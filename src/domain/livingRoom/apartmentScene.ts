import type { InteriorProject } from "../interiorProject";
import { resolveModelViewPose } from "./modelViewPresets";
import { createRoomSceneCache, type RoomSceneLookup } from "./roomSceneCache";
import { compileMaterials } from "./sceneCompiler";
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
    roomId: project.activeRoomId,
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
 */
export function compileApartmentScene(
  project: InteriorProject,
  sceneFor: RoomSceneLookup = createRoomSceneCache(project),
): CompiledLivingRoomScene {
  const scenes = project.rooms.map((room) => sceneFor(room.id));
  const nodes = apartmentSceneNodes(scenes);
  const materials = compileMaterials(project);
  const lights: CompiledLivingRoomScene["lights"] = [];
  const bounds = computeCompiledSceneBounds(nodes);
  const cameras = [overviewCamera(project, bounds)];
  const style = sceneStyle(project, scenes);
  const architectureBounds = computeArchitectureBounds(nodes);
  const fingerprintSource = {
    roomId: project.activeRoomId,
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
