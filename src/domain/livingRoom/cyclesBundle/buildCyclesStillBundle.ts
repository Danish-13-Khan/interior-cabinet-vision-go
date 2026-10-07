import type { InteriorProject } from "../../interiorProject";
import { resolveEnvironmentLightingQuality } from "../environmentLightingQuality";
import { computeGlbScaleFromNativeSize } from "../glbScale";
import { environmentScaleForRoomLight, roomLightScaleForMood, type LightingMood } from "../lightingMood";
import type { ModelNativeSizeMm } from "../renderAssetContracts";
import type { CompiledLivingRoomScene, CompiledPrimitive, CompiledSceneNode } from "../sceneTypes";
import { CYCLES_STILL_ENGINE, CYCLES_STILL_ENHANCEMENTS } from "../stillEngine/constants";
import { buildStillJob } from "../stillJob/buildStillJob";
import { cyclesMaterialsFor } from "./cyclesMaterials";
import { fixtureForCycles, recipeLightForCycles, windowKeysForCycles } from "./cyclesLights";
import {
  CYCLES_BUNDLE_SCHEMA_VERSION,
  CYCLES_LIGHT_UNITS_VERSION,
  type CyclesFixture,
  type CyclesModelRef,
  type CyclesNode,
  type CyclesPrimitive,
  type CyclesRecipeLight,
  type CyclesStillBundle,
  type CyclesTransform,
  type CyclesVec3,
} from "./types";

/** Phase 3 gate: 1080p in three minutes on the target box. Samples adapt under the cap. */
export const CYCLES_DEFAULT_TIME_CAP_SECONDS = 180;
export const CYCLES_DEFAULT_SAMPLES_MAX = 512;

export type CyclesModelAssetLookup = Record<string, { assetKey: string; nativeSizeMm: ModelNativeSizeMm }>;

export type BuildCyclesStillBundleInput = {
  project: InteriorProject;
  scene: CompiledLivingRoomScene;
  cameraId: string;
  jobId: string;
  createdAt?: string;
  widthPx: number;
  heightPx: number;
  seed?: number;
  samplesMax?: number;
  timeCapSeconds?: number;
  mood: LightingMood;
  /** The HDRI the manifest binds to the active recipe, or null when none is available. */
  environment: { assetKey: string; intensity: number } | null;
  /** Catalog GLBs by model asset id. Missing ids fall back to the node's primitives. */
  modelAssets: CyclesModelAssetLookup;
};

function metres(point: { x: number; y: number; z: number }): CyclesVec3 {
  return { x: point.x / 1000, y: point.y / 1000, z: point.z / 1000 };
}

function transformOf(
  positionMm: { x: number; y: number; z: number },
  rotationDegrees: { x: number; y: number; z: number },
): CyclesTransform {
  return {
    position: metres(positionMm),
    rotation: { x: rotationDegrees.x, y: rotationDegrees.y, z: rotationDegrees.z, order: "XYZ" },
  };
}

function primitiveForCycles(primitive: CompiledPrimitive): CyclesPrimitive {
  const common = {
    id: primitive.id,
    local: transformOf(primitive.positionMm, primitive.rotationDegrees),
    materialId: primitive.materialId,
    castShadow: primitive.castShadow,
    receiveShadow: primitive.receiveShadow,
  };
  if (primitive.kind === "box") {
    return { kind: "box", sizeM: { width: primitive.sizeMm.width / 1000, height: primitive.sizeMm.height / 1000, depth: primitive.sizeMm.depth / 1000 }, ...common };
  }
  if (primitive.kind === "rounded-box") {
    return {
      kind: "rounded-box",
      sizeM: { width: primitive.sizeMm.width / 1000, height: primitive.sizeMm.height / 1000, depth: primitive.sizeMm.depth / 1000 },
      radiusM: primitive.radiusMm / 1000,
      smoothness: primitive.smoothness,
      ...common,
    };
  }
  if (primitive.kind === "cylinder") {
    return {
      kind: "cylinder",
      radiusTopM: primitive.radiusTopMm / 1000,
      radiusBottomM: primitive.radiusBottomMm / 1000,
      heightM: primitive.heightMm / 1000,
      radialSegments: primitive.radialSegments,
      ...common,
    };
  }
  return {
    kind: "polygon-prism",
    outlineM: primitive.outlineMm.map((point) => ({ x: point.x / 1000, z: point.z / 1000 })),
    holesM: primitive.holesMm.map((hole) => hole.map((point) => ({ x: point.x / 1000, z: point.z / 1000 }))),
    heightM: primitive.heightMm / 1000,
    ...common,
  };
}

function modelRefFor(node: CompiledSceneNode, modelAssets: CyclesModelAssetLookup, warnings: string[]): CyclesModelRef | null {
  const binding = node.renderBinding;
  if (binding.strategy !== "glb") return null;
  if (binding.modelUrl) {
    warnings.push(`${node.name} (${node.id}) is a project-owned GLB; Cycles uses its placeholder primitives.`);
    return null;
  }
  const asset = binding.modelAssetId ? modelAssets[binding.modelAssetId] : undefined;
  if (!binding.modelAssetId || !asset) return null;
  const scale = binding.targetSizeMm
    ? computeGlbScaleFromNativeSize(binding.targetSizeMm, asset.nativeSizeMm)
    : { x: 1, y: 1, z: 1 };
  return {
    modelAssetId: binding.modelAssetId,
    assetKey: asset.assetKey,
    scale: { x: scale.x, y: scale.y, z: scale.z },
    materialGroups: { ...(binding.modelMaterialGroups ?? {}) },
    materialBindings: { ...binding.materialBindings },
    preserveSourceMaterials: binding.preserveSourceMaterials === true,
  };
}

function requireCamera(project: InteriorProject, cameraId: string) {
  const camera = project.cameras.find((item) => item.id === cameraId);
  if (!camera) throw new Error(`Cycles bundle camera not found: ${cameraId}`);
  return camera;
}

/**
 * Build the Cycles still bundle from the authored project and its compiled scene.
 * Never reads the live viewport: no cutaways, no editor helpers, no hidden ceiling.
 */
export function buildCyclesStillBundle(input: BuildCyclesStillBundleInput): CyclesStillBundle {
  const camera = requireCamera(input.project, input.cameraId);
  const seed = input.seed ?? 0;
  const job = buildStillJob({
    project: input.project,
    cameraId: camera.id,
    jobId: input.jobId,
    createdAt: input.createdAt,
    seed,
    engine: { id: CYCLES_STILL_ENGINE.id, version: CYCLES_STILL_ENGINE.version },
    allowedEnhancements: [...CYCLES_STILL_ENHANCEMENTS],
    qualityPresetId: "presentation",
    styleIds: [input.scene.style.id],
  });
  const warnings: string[] = [];
  const { materials, warnings: materialWarnings } = cyclesMaterialsFor(input.scene.materials);
  warnings.push(...materialWarnings);

  const nodes: CyclesNode[] = input.scene.nodes.map((node) => {
    const model = modelRefFor(node, input.modelAssets, warnings);
    return {
      id: node.id,
      name: node.name,
      sourceObjectId: node.sourceObjectId,
      world: transformOf(node.positionMm, node.rotationDegrees),
      // A GLB node keeps its primitives as the fallback the viewport would also draw.
      primitives: model ? [] : node.primitives.map(primitiveForCycles),
      model,
    };
  });

  const roomLightScale = roomLightScaleForMood(input.mood);
  const fixtures: CyclesFixture[] = [];
  const recipeLights: CyclesRecipeLight[] = [];
  for (const light of input.scene.lights) {
    const fixture = fixtureForCycles(light);
    if (fixture) {
      fixtures.push(fixture);
      continue;
    }
    const recipe = recipeLightForCycles(light, roomLightScale);
    if (recipe) recipeLights.push(recipe);
  }

  const heroQuality = resolveEnvironmentLightingQuality("hero", "presentation");
  const environment = input.environment;
  const colorManagement = input.scene.style.colorManagement;
  return {
    schemaVersion: CYCLES_BUNDLE_SCHEMA_VERSION,
    lightUnitsVersion: CYCLES_LIGHT_UNITS_VERSION,
    createdAt: job.createdAt,
    job,
    render: {
      widthPx: input.widthPx,
      heightPx: input.heightPx,
      samplesMax: input.samplesMax ?? CYCLES_DEFAULT_SAMPLES_MAX,
      timeCapSeconds: input.timeCapSeconds ?? CYCLES_DEFAULT_TIME_CAP_SECONDS,
      seed,
      denoise: true,
      device: "auto",
    },
    camera: {
      eyeM: metres(camera.position),
      targetM: metres(camera.target),
      fovDeg: camera.fieldOfViewDegrees,
    },
    environment: {
      lightingRecipeId: input.scene.lightingRecipeId,
      hdriAssetKey: environment?.assetKey ?? null,
      hdriStrength: environment
        ? environment.intensity * heroQuality.intensityScale * environmentScaleForRoomLight(roomLightScale)
        : 0,
      backgroundColor: input.scene.style.environment.backgroundColor,
      exposure: colorManagement.exposure,
      toneMapping: colorManagement.toneMapping,
    },
    materials,
    nodes,
    fixtures,
    recipeLights,
    windowKeys: windowKeysForCycles(input.scene, roomLightScale),
    materialIds: job.materials.map((slot) => slot.materialId),
    sceneFingerprint: input.scene.fingerprint,
    warnings,
  };
}
