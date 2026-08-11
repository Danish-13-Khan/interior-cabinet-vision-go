export const INTERIOR_PROJECT_SCHEMA_VERSION = 1;
export const INTERIOR_PROJECT_FILE_FORMAT = "interior-project";

export type EntityId = string;
export type InteriorUnits = "mm";
export type RoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "office"
  | "utility"
  | "custom";

export type Point2Mm = { x: number; z: number };
export type Point3Mm = { x: number; y: number; z: number };
export type EulerDegrees = { x: number; y: number; z: number };
export type Size3Mm = { widthMm: number; heightMm: number; depthMm: number };
export type EntityExtensions = Record<string, unknown>;
export type ParameterValue = string | number | boolean;

export type InteriorRoomEntity = {
  id: EntityId;
  name: string;
  roomType: RoomType;
  dimensions: Size3Mm;
  wallThicknessMm: number;
  extensions?: EntityExtensions;
};

export type WallEntity = {
  id: EntityId;
  roomId: EntityId;
  start: Point2Mm;
  end: Point2Mm;
  heightMm: number;
  thicknessMm: number;
  visible: boolean;
  materialId: EntityId | null;
  extensions?: EntityExtensions;
};

export type OpeningKind = "door" | "window" | "opening";

export type OpeningEntity = {
  id: EntityId;
  roomId: EntityId;
  wallId: EntityId;
  kind: OpeningKind;
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;
  swingDirection?: "in" | "out";
  extensions?: EntityExtensions;
};

export type InteriorObjectKind =
  | "cabinet"
  | "furniture"
  | "lighting"
  | "decor"
  | "custom";

export type InteriorObjectEntity = {
  id: EntityId;
  roomId: EntityId;
  kind: InteriorObjectKind;
  category: string;
  catalogItemId: string;
  name: string;
  position: Point3Mm;
  rotation: EulerDegrees;
  dimensions: Size3Mm;
  materialSlots: Record<string, EntityId>;
  parameters: Record<string, ParameterValue>;
  extensions?: EntityExtensions;
};

export type MaterialKind =
  | "wood"
  | "fabric"
  | "metal"
  | "glass"
  | "paint"
  | "stone"
  | "laminate"
  | "custom";

export type MaterialEntity = {
  id: EntityId;
  name: string;
  kind: MaterialKind;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  extensions?: EntityExtensions;
};

export type LightKind = "ambient" | "directional" | "point" | "spot" | "area";

export type LightEntity = {
  id: EntityId;
  roomId: EntityId | null;
  name: string;
  kind: LightKind;
  position: Point3Mm;
  rotation: EulerDegrees;
  color: string;
  intensity: number;
  enabled: boolean;
  parameters: Record<string, ParameterValue>;
};

export type CameraEntity = {
  id: EntityId;
  roomId: EntityId;
  name: string;
  position: Point3Mm;
  target: Point3Mm;
  fieldOfViewDegrees: number;
  isDefault: boolean;
};

export type RenderQuality = "draft" | "standard" | "presentation";

export type RenderSettings = {
  widthPx: number;
  heightPx: number;
  quality: RenderQuality;
  exposure: number;
  transparentBackground: boolean;
  activeCameraId: EntityId | null;
  lightingRecipeId: string;
};

export type InteriorProject = {
  schemaVersion: typeof INTERIOR_PROJECT_SCHEMA_VERSION;
  id: EntityId;
  name: string;
  units: InteriorUnits;
  createdAt: string;
  updatedAt: string;
  activeRoomId: EntityId;
  rooms: InteriorRoomEntity[];
  walls: WallEntity[];
  openings: OpeningEntity[];
  objects: InteriorObjectEntity[];
  materials: MaterialEntity[];
  lights: LightEntity[];
  cameras: CameraEntity[];
  renderSettings: RenderSettings;
  extensions?: EntityExtensions;
};

export type InteriorProjectFile = {
  format: typeof INTERIOR_PROJECT_FILE_FORMAT;
  schemaVersion: typeof INTERIOR_PROJECT_SCHEMA_VERSION;
  savedAt: string;
  project: InteriorProject;
};

export type InteriorValidationIssue = {
  severity: "warning" | "error";
  code: string;
  path: string;
  message: string;
  repaired: boolean;
};

export type InteriorValidationResult = {
  project: InteriorProject;
  issues: InteriorValidationIssue[];
};
