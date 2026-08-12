import type { MaterialKind } from "../interiorProject";

/** Viewport vs export quality. Never stored on InteriorProject JSON. */
export type RenderMode = "preview" | "hero";

export type RenderAssetStrategy = "glb" | "procedural";

/** Stable, JSON-safe binding emitted by the scene compiler. */
export type RenderBinding = {
  strategy: RenderAssetStrategy;
  modelAssetId?: string;
  materialBindings: Record<string, string>;
  uvScaleMm?: number;
};

export type TextureAssetId = string;
export type ModelAssetId = string;
export type EnvironmentAssetId = string;
export type MaterialAssetId = string;

export type MaterialAssetDefinition = {
  id: MaterialAssetId;
  name: string;
  kind: MaterialKind;
  baseColor: string;
  roughness: number;
  metalness: number;
  opacity: number;
  uvScaleMm: number;
  colorMapId?: TextureAssetId;
  normalMapId?: TextureAssetId;
  roughnessMapId?: TextureAssetId;
  aoMapId?: TextureAssetId;
  /** When true, renderer synthesizes maps instead of loading files. */
  proceduralFallback: boolean;
};

export type ModelAssetDefinition = {
  id: ModelAssetId;
  name: string;
  catalogItemId: string;
  /** Relative key for a future local GLB; never written into project JSON. */
  assetKey: string;
  available: boolean;
  defaultUvScaleMm: number;
};

export type TextureAssetDefinition = {
  id: TextureAssetId;
  name: string;
  kind: "color" | "normal" | "roughness" | "ao";
  assetKey: string;
  available: boolean;
};

export type EnvironmentAssetDefinition = {
  id: EnvironmentAssetId;
  name: string;
  lightingRecipeId: string;
  assetKey: string;
  available: boolean;
};

export type RenderModeQuality = {
  mode: RenderMode;
  anisotropy: number;
  textureDetail: "low" | "high";
  envMapIntensityScale: number;
  bumpScale: number;
};
