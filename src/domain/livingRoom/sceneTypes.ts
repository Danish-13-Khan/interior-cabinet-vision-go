import type {
  CameraEntity,
  EulerDegrees,
  LightEntity,
  MaterialKind,
  Point3Mm,
} from "../interiorProject";
import type { RenderBinding } from "./renderAssetContracts";
import type {
  LivingRoomColorManagement,
  LivingRoomEnvironment,
  LivingRoomStyleId,
} from "./stylePresets";

export type CompiledMaterial = {
  id: string;
  name: string;
  kind: MaterialKind;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  /** Stable material-asset id for the PBR registry (not a file path). */
  materialAssetId: string;
  uvScaleMm: number;
};

export type CompiledBoxPrimitive = {
  kind: "box";
  id: string;
  sizeMm: { width: number; height: number; depth: number };
  positionMm: Point3Mm;
  rotationDegrees: EulerDegrees;
  materialId: string;
  geometryKey: string;
  castShadow: boolean;
  receiveShadow: boolean;
};

export type CompiledRoundedBoxPrimitive = {
  kind: "rounded-box";
  id: string;
  sizeMm: { width: number; height: number; depth: number };
  radiusMm: number;
  smoothness: number;
  positionMm: Point3Mm;
  rotationDegrees: EulerDegrees;
  materialId: string;
  geometryKey: string;
  castShadow: boolean;
  receiveShadow: boolean;
};

export type CompiledCylinderPrimitive = {
  kind: "cylinder";
  id: string;
  radiusTopMm: number;
  radiusBottomMm: number;
  heightMm: number;
  radialSegments: number;
  positionMm: Point3Mm;
  rotationDegrees: EulerDegrees;
  materialId: string;
  geometryKey: string;
  castShadow: boolean;
  receiveShadow: boolean;
};

export type CompiledPrimitive =
  | CompiledBoxPrimitive
  | CompiledRoundedBoxPrimitive
  | CompiledCylinderPrimitive;

export type CompiledSceneNode = {
  id: string;
  name: string;
  sourceObjectId: string | null;
  adapterId: string;
  positionMm: Point3Mm;
  rotationDegrees: EulerDegrees;
  primitives: CompiledPrimitive[];
  placeholder: boolean;
  metadata: Record<string, string | number | boolean>;
  renderBinding: RenderBinding;
};

export type CompiledSceneBounds = {
  min: Point3Mm;
  max: Point3Mm;
  center: Point3Mm;
  size: { widthMm: number; heightMm: number; depthMm: number };
};

export type CompiledLivingRoomScene = {
  compilerVersion: 1;
  projectId: string;
  roomId: string;
  units: "mm";
  nodes: CompiledSceneNode[];
  materials: CompiledMaterial[];
  lights: LightEntity[];
  cameras: CameraEntity[];
  /** Active lighting recipe from render settings (compiled only, not project JSON). */
  lightingRecipeId: string;
  style: {
    id: LivingRoomStyleId;
    name: string;
    environment: LivingRoomEnvironment;
    colorManagement: LivingRoomColorManagement;
  };
  bounds: CompiledSceneBounds;
  fingerprint: string;
  warnings: string[];
};
