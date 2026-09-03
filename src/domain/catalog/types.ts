import type { MaterialKind } from "../interiorProject";

export type CatalogLifecycle = "active" | "deprecated" | "blocked";

export type CatalogPlacement = "floor" | "wall" | "ceiling" | "surface";

export type CatalogVisibility = {
  objectBrowser: boolean;
  templateEligible: boolean;
};

export type MaterialSlotPolicy = {
  sourceMaterialNames: string[];
  allowedMaterialKinds: MaterialKind[];
  allowedMaterialTags?: string[];
  defaultMaterialId?: string;
  editable: boolean;
};

export type CatalogItem = {
  id: string;
  version: number;
  name: string;
  category: string;
  subcategory: string;
  tags: string[];
  placement: CatalogPlacement;
  dimensionsMm: { width: number; height: number; depth: number };
  modelAssetId: string;
  images: { thumbnailId?: string; galleryIds?: string[] };
  materialSlots: Record<string, MaterialSlotPolicy>;
  lifecycle: CatalogLifecycle;
  visibility: CatalogVisibility;
  source: { pack: "kenney-furniture"; licenseId: "cc0-1.0" };
};

export type CatalogFileKind = "model" | "image" | "texture";

export type CatalogFileBase = {
  id: string;
  kind: CatalogFileKind;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  contentHash: string;
};

export type CatalogModelFile = CatalogFileBase & {
  kind: "model";
  nativeBoundsM: { width: number; height: number; depth: number };
  primitiveCount: number;
  triangleCount: number;
  originalMaterialNames: string[];
  warnings: string[];
};

export type CatalogImageRole = "thumbnail" | "preview" | "template-thumbnail";

export type CatalogImageFile = CatalogFileBase & {
  kind: "image";
  role: CatalogImageRole;
};

export type CatalogTextureFile = CatalogFileBase & {
  kind: "texture";
  role: string;
  colorSpace?: "srgb" | "linear";
};

export type CatalogFileRecord = CatalogModelFile | CatalogImageFile | CatalogTextureFile;

export type CatalogMaterial = {
  id: string;
  version: number;
  name: string;
  kind: MaterialKind;
  tags: string[];
  swatchColor: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  opacity: number;
  uvScaleMm: number;
  textureAssetIds?: {
    baseColor?: string;
    normal?: string;
    roughness?: string;
    ao?: string;
  };
  lifecycle: CatalogLifecycle;
  visibleInPicker: boolean;
};

export type CatalogLicense = {
  id: string;
  name: string;
  sourceUrl: string;
  attributionRequired: boolean;
  licenseFileObjectKey: string;
};

export type CatalogTemplateObject = {
  templateObjectId: string;
  catalogItemId: string;
  catalogItemVersion?: number;
  positionMm: { x: number; y: number; z: number };
  rotationY: number;
  materialOverrides?: Record<string, string>;
};

export type ProjectTemplate = {
  id: string;
  version: number;
  name: string;
  category: "kitchen" | "living-room" | "bedroom" | "bathroom" | "empty";
  description: string;
  images: { thumbnailId: string };
  room: { widthMm: number; depthMm: number; heightMm: number };
  objects: CatalogTemplateObject[];
};

export type CatalogManifest = {
  schemaVersion: number;
  catalogVersion: string;
  generatedAt: string;
  licenses: CatalogLicense[];
  files: CatalogFileRecord[];
  materials: CatalogMaterial[];
  items: CatalogItem[];
  templates: ProjectTemplate[];
};

export type CatalogQuery = {
  text?: string;
  category?: string;
  lifecycle?: CatalogLifecycle;
  objectBrowser?: boolean;
  templateEligible?: boolean;
};

export type CatalogPage = {
  items: CatalogItem[];
  total: number;
};

export type ResolvedAsset = {
  fileId: string;
  url: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  contentHash: string;
};
