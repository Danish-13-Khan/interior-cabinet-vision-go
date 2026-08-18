import type { InteriorProject } from "../interiorProject";
import {
  defaultUvScaleMmForMaterial,
  materialAssetIdForEntity,
} from "./renderAssetBindings";
import { compileLivingRoomObjectNode } from "./sceneAdapters";
import {
  computeArchitectureBounds,
  computeCompiledSceneBounds,
  hashString,
  stableStringify,
} from "./sceneCompilerBounds";
import {
  compileLivingRoomArchitecture,
  FALLBACK_MATERIAL_ID,
  FLOOR_MATERIAL_ID,
} from "./sceneCompilerRoom";
import {
  resolveLivingRoomColorManagement,
  resolveLivingRoomEnvironment,
  resolveLivingRoomStyle,
} from "./stylePresets";
import type { CompiledLivingRoomScene, CompiledMaterial } from "./sceneTypes";
import { sampleWindowOpenings } from "./windowKeyLight";

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
      materialAssetId: materialAssetIdForEntity(material.id),
      uvScaleMm: defaultUvScaleMmForMaterial(material.id),
    })),
    {
      id: FALLBACK_MATERIAL_ID,
      name: "Safe Placeholder",
      kind: "custom" as const,
      color: "#d29a44",
      roughness: 0.72,
      metalness: 0,
      opacity: 1,
      materialAssetId: FALLBACK_MATERIAL_ID,
      uvScaleMm: 1000,
    },
    {
      id: FLOOR_MATERIAL_ID,
      name: "Floor Fallback",
      kind: "wood" as const,
      color: "#b98a58",
      roughness: 0.68,
      metalness: 0,
      opacity: 1,
      materialAssetId: FLOOR_MATERIAL_ID,
      uvScaleMm: 900,
    },
  ];
}

/** Compile canonical project data without importing React or Three.js. */
export function compileLivingRoomScene(
  project: InteriorProject,
): CompiledLivingRoomScene {
  const roomId = project.activeRoomId;
  const objectNodes = project.objects
    .filter((object) => object.roomId === roomId && object.extensions?.layerVisible !== false)
    .map(compileLivingRoomObjectNode);
  const nodes = [...compileLivingRoomArchitecture(project), ...objectNodes];
  const materials = compileMaterials(project);
  const lights = project.lights.filter((light) => light.roomId === null || light.roomId === roomId);
  const cameras = project.cameras.filter((camera) => camera.roomId === roomId);
  const stylePreset = resolveLivingRoomStyle(project);
  const style = {
    id: stylePreset.id,
    name: stylePreset.name,
    environment: resolveLivingRoomEnvironment(project),
    colorManagement: resolveLivingRoomColorManagement(project),
  };
  const fingerprintSource = {
    roomId,
    nodes,
    materials,
    lights,
    cameras,
    style,
    lightingRecipeId: project.renderSettings.lightingRecipeId,
  };
  const bounds = computeCompiledSceneBounds(nodes);
  const architectureBounds = computeArchitectureBounds(nodes);
  const windowOpenings = sampleWindowOpenings({
    walls: project.walls.filter((wall) => wall.roomId === roomId),
    openings: project.openings.filter((opening) => opening.roomId === roomId),
    roomCenterMm: architectureBounds.center,
  });
  return {
    compilerVersion: 1,
    projectId: project.id,
    roomId,
    units: "mm",
    nodes,
    materials,
    lights,
    cameras,
    lightingRecipeId: project.renderSettings.lightingRecipeId,
    windowOpenings,
    style,
    bounds,
    fingerprint: `lr-scene-v1-${hashString(stableStringify(fingerprintSource))}`,
    warnings: objectNodes
      .filter((node) => node.placeholder)
      .map((node) => `${node.name} uses a safe placeholder because ${String(node.metadata.catalogItemId)} has no scene adapter.`),
  };
}
