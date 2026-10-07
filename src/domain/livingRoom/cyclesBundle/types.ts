import type { MaterialKind } from "../../interiorProject";
import type { StillJob } from "../stillJob/types";

/**
 * Everything `render-sources/blender/render_still.py` needs to rebuild the authored
 * scene in Cycles. Geometry is described, not exported: boxes, cylinders and
 * polygon prisms are rebuilt in Blender with exact millimetre sizes, and catalog
 * GLBs are referenced by asset key. Metres throughout, three.js axes (Y up);
 * the Python script applies the Z-up basis change once.
 */
export const CYCLES_BUNDLE_SCHEMA_VERSION = 1 as const;

/** Light-unit and scene-build rules the Python script must match. Bump with the engine version. */
export const CYCLES_LIGHT_UNITS_VERSION = 1 as const;

export type CyclesVec3 = { x: number; y: number; z: number };

/** Degrees. `order` is the three.js Euler order the viewport composes with. */
export type CyclesEuler = { x: number; y: number; z: number; order: "XYZ" | "YXZ" };

export type CyclesTransform = {
  position: CyclesVec3;
  rotation: CyclesEuler;
  scale?: CyclesVec3;
};

export type CyclesPrimitive =
  | {
    kind: "box";
    id: string;
    sizeM: { width: number; height: number; depth: number };
    local: CyclesTransform;
    materialId: string;
    castShadow: boolean;
    receiveShadow: boolean;
  }
  | {
    kind: "rounded-box";
    id: string;
    sizeM: { width: number; height: number; depth: number };
    radiusM: number;
    smoothness: number;
    local: CyclesTransform;
    materialId: string;
    castShadow: boolean;
    receiveShadow: boolean;
  }
  | {
    kind: "cylinder";
    id: string;
    radiusTopM: number;
    radiusBottomM: number;
    heightM: number;
    radialSegments: number;
    local: CyclesTransform;
    materialId: string;
    castShadow: boolean;
    receiveShadow: boolean;
  }
  | {
    kind: "polygon-prism";
    id: string;
    /** Shape points in the primitive's local XZ plane, extruded along local Z like three's ExtrudeGeometry. */
    outlineM: { x: number; z: number }[];
    holesM: { x: number; z: number }[][];
    heightM: number;
    local: CyclesTransform;
    materialId: string;
    castShadow: boolean;
    receiveShadow: boolean;
  };

export type CyclesModelRef = {
  modelAssetId: string;
  /** Public asset key, e.g. `models/soft-goods/sofa-3-seat.glb`. The runner resolves it to a file. */
  assetKey: string;
  scale: CyclesVec3;
  /** Semantic slot → mesh/material name token inside the GLB. */
  materialGroups: Record<string, string>;
  /** Semantic slot → project material id (the still's finish identity). */
  materialBindings: Record<string, string>;
  preserveSourceMaterials: boolean;
};

export type CyclesNode = {
  id: string;
  name: string;
  sourceObjectId: string | null;
  world: CyclesTransform;
  primitives: CyclesPrimitive[];
  model: CyclesModelRef | null;
};

export type CyclesScanSource = {
  /** Folder under the repo root holding color/normal/roughness PNGs and source.json. */
  sourceDir: string;
  polyhaven: string;
  tileMm: number;
};

export type CyclesMaterial = {
  id: string;
  name: string;
  kind: MaterialKind;
  /** Style tint. A scan's colour map is mean-normalised detail multiplied by this. */
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  tileMm: number;
  uvRotationDeg: number;
  grainDirection: string | null;
  scan: CyclesScanSource | null;
};

export type CyclesFixturePart = {
  shape: "box" | "cylinder" | "cone";
  /** Optional intermediate frame between the fixture group and `local` (track heads). */
  within?: CyclesTransform;
  /** box: width/height/depth; cylinder/cone: radiusTop/radiusBottom/height in `cyl`. */
  box?: { width: number; height: number; depth: number };
  cyl?: { radiusTop: number; radiusBottom: number; height: number; segments: number };
  local: CyclesTransform;
  color: string;
  metalness: number;
  roughness: number;
  emissiveColor: string | null;
  /** Viewport `emissiveIntensity`; the script maps it to an emission strength. */
  emissiveStrength: number;
};

export type CyclesFixtureLight =
  | {
    kind: "area";
    id: string;
    role: "emitter" | "wall-band" | "halo";
    within?: CyclesTransform;
    local: CyclesTransform;
    sizeM: { width: number; height: number };
    color: string;
    kelvin: number | null;
    nits: number;
    castShadow: boolean;
  }
  | {
    kind: "spot";
    id: string;
    role: "head";
    within?: CyclesTransform;
    local: CyclesTransform;
    color: string;
    kelvin: number | null;
    candela: number;
    beamAngleDeg: number;
    penumbra: number;
    rangeM: number;
    castShadow: boolean;
  }
  | {
    kind: "point";
    id: string;
    role: "pendant";
    within?: CyclesTransform;
    local: CyclesTransform;
    color: string;
    kelvin: number | null;
    candela: number;
    radiusM: number;
    rangeM: number;
    castShadow: boolean;
  };

/** One authored fixture: its body parts and the lights the viewport creates for it, in one local frame. */
export type CyclesFixture = {
  lightId: string;
  name: string;
  fixtureKind: string;
  enabled: boolean;
  /** 0–100 authoring brightness, for provenance. */
  brightness: number;
  group: CyclesTransform;
  parts: CyclesFixturePart[];
  lights: CyclesFixtureLight[];
};

/** Recipe lights that are not fixtures, already attachment-resolved and recipe-placed. */
export type CyclesRecipeLight =
  | { kind: "ambient"; id: string; name: string; color: string; intensity: number }
  | { kind: "sun"; id: string; name: string; positionM: CyclesVec3; targetM: CyclesVec3; color: string; lux: number; castShadow: boolean }
  | { kind: "point"; id: string; name: string; positionM: CyclesVec3; color: string; candela: number; rangeM: number }
  | { kind: "spot"; id: string; name: string; positionM: CyclesVec3; color: string; candela: number; beamAngleDeg: number; penumbra: number }
  | { kind: "area"; id: string; name: string; world: CyclesTransform; sizeM: { width: number; height: number }; color: string; nits: number };

export type CyclesWindowKey = {
  id: string;
  openingId: string;
  positionM: CyclesVec3;
  targetM: CyclesVec3;
  color: string;
  lux: number;
  castShadow: boolean;
};

export type CyclesEnvironment = {
  lightingRecipeId: string;
  /** Public asset key of the HDRI, e.g. `environments/daylight.hdr`; null falls back to a flat sky. */
  hdriAssetKey: string | null;
  /** Manifest intensity × the hero environment scale the viewport applies at this quality. */
  hdriStrength: number;
  backgroundColor: string;
  /** Linear exposure multiplier from the style; the script converts to stops. */
  exposure: number;
  toneMapping: "aces-filmic" | "agx";
};

export type CyclesRenderSettings = {
  widthPx: number;
  heightPx: number;
  samplesMax: number;
  /** Cycles stops refining at this wall-clock limit; the Phase 3 gate is 180 s at 1080p. */
  timeCapSeconds: number;
  seed: number;
  denoise: boolean;
  device: "auto" | "cpu" | "gpu";
};

export type CyclesStillBundle = {
  schemaVersion: typeof CYCLES_BUNDLE_SCHEMA_VERSION;
  lightUnitsVersion: typeof CYCLES_LIGHT_UNITS_VERSION;
  createdAt: string;
  job: StillJob;
  render: CyclesRenderSettings;
  camera: { eyeM: CyclesVec3; targetM: CyclesVec3; fovDeg: number };
  environment: CyclesEnvironment;
  materials: CyclesMaterial[];
  nodes: CyclesNode[];
  fixtures: CyclesFixture[];
  recipeLights: CyclesRecipeLight[];
  windowKeys: CyclesWindowKey[];
  /** Material ids the still is allowed to show, in slot order. Provenance must echo this list. */
  materialIds: string[];
  sceneFingerprint: string;
  /** Things the bundle could not carry (imported textures, project-owned GLBs). */
  warnings: string[];
};
