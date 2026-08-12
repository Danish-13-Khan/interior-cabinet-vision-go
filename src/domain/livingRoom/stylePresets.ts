import type {
  InteriorProject,
  MaterialEntity,
} from "../interiorProject";
import {
  applyLivingRoomLightingRecipe,
  type LivingRoomLightingRecipeId,
} from "./lighting";
import {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "./materials";

export type LivingRoomStyleId =
  | "warm-contemporary"
  | "nordic-light"
  | "moody-walnut";

export type LivingRoomEnvironment = {
  backgroundColor: string;
  fogColor: string;
  fogNearMm: number;
  fogFarMm: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  gridPrimaryColor: string;
  gridSecondaryColor: string;
  contactShadowOpacity: number;
  contactShadowBlur: number;
};

export type LivingRoomColorManagement = {
  toneMapping: "aces-filmic";
  outputColorSpace: "srgb";
  exposure: number;
  shadowMap: "pcf-soft";
};

type MaterialRecipe = Pick<
  MaterialEntity,
  "color" | "roughness" | "metalness" | "opacity"
>;

export type LivingRoomStylePreset = {
  id: LivingRoomStyleId;
  version: 1;
  name: string;
  description: string;
  swatches: readonly [string, string, string];
  lightingRecipeId: LivingRoomLightingRecipeId;
  materialRecipes: Readonly<Record<string, MaterialRecipe>>;
  environment: LivingRoomEnvironment;
  colorManagement: LivingRoomColorManagement;
};

const materialRecipe = (
  color: string,
  roughness: number,
  metalness = 0,
  opacity = 1,
): MaterialRecipe => ({ color, roughness, metalness, opacity });

export const LIVING_ROOM_STYLE_PRESETS = [
  {
    id: "warm-contemporary",
    version: 1,
    name: "Warm Contemporary",
    description: "Natural oak, oatmeal textiles and balanced studio daylight.",
    swatches: ["#b98a58", "#c8baa6", "#73765a"],
    lightingRecipeId: "neutral-studio",
    materialRecipes: {
      [LIVING_ROOM_MATERIAL_IDS.wallPaint]: materialRecipe("#e9e3d8", 0.86),
      [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: materialRecipe("#f5f2eb", 0.9),
      [LIVING_ROOM_MATERIAL_IDS.naturalOak]: materialRecipe("#b98a58", 0.62),
      [LIVING_ROOM_MATERIAL_IDS.walnut]: materialRecipe("#5a3928", 0.56),
      [LIVING_ROOM_MATERIAL_IDS.oatmealFabric]: materialRecipe("#c8baa6", 0.96),
      [LIVING_ROOM_MATERIAL_IDS.oliveFabric]: materialRecipe("#73765a", 0.95),
      [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: materialRecipe("#2d302f", 0.36, 0.72),
      [LIVING_ROOM_MATERIAL_IDS.clearGlass]: materialRecipe("#d8e4e2", 0.08, 0, 0.32),
      [LIVING_ROOM_MATERIAL_IDS.woolRug]: materialRecipe("#b8a68d", 1),
    },
    environment: {
      backgroundColor: "#dfe5e9",
      fogColor: "#dfe5e9",
      fogNearMm: 10500,
      fogFarMm: 23000,
      hemisphereSkyColor: "#eaf2fb",
      hemisphereGroundColor: "#9a8065",
      hemisphereIntensity: 0.34,
      gridPrimaryColor: "#8394a2",
      gridSecondaryColor: "#bdc7cf",
      contactShadowOpacity: 0.3,
      contactShadowBlur: 2.8,
    },
    colorManagement: {
      toneMapping: "aces-filmic",
      outputColorSpace: "srgb",
      exposure: 1.05,
      shadowMap: "pcf-soft",
    },
  },
  {
    id: "nordic-light",
    version: 1,
    name: "Nordic Light",
    description: "Pale timber, soft sage fabrics and cool window daylight.",
    swatches: ["#cba979", "#d7cec0", "#87937a"],
    lightingRecipeId: "daylight",
    materialRecipes: {
      [LIVING_ROOM_MATERIAL_IDS.wallPaint]: materialRecipe("#ecece6", 0.9),
      [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: materialRecipe("#fbfaf5", 0.94),
      [LIVING_ROOM_MATERIAL_IDS.naturalOak]: materialRecipe("#cba979", 0.7),
      [LIVING_ROOM_MATERIAL_IDS.walnut]: materialRecipe("#89634a", 0.64),
      [LIVING_ROOM_MATERIAL_IDS.oatmealFabric]: materialRecipe("#d7cec0", 0.98),
      [LIVING_ROOM_MATERIAL_IDS.oliveFabric]: materialRecipe("#87937a", 0.98),
      [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: materialRecipe("#3d4442", 0.42, 0.58),
      [LIVING_ROOM_MATERIAL_IDS.clearGlass]: materialRecipe("#dcebf0", 0.06, 0, 0.26),
      [LIVING_ROOM_MATERIAL_IDS.woolRug]: materialRecipe("#c9c1b5", 1),
    },
    environment: {
      backgroundColor: "#e8eef1",
      fogColor: "#e8eef1",
      fogNearMm: 11000,
      fogFarMm: 25000,
      hemisphereSkyColor: "#f1f7ff",
      hemisphereGroundColor: "#a9a497",
      hemisphereIntensity: 0.5,
      gridPrimaryColor: "#8fa0a8",
      gridSecondaryColor: "#c7d0d4",
      contactShadowOpacity: 0.24,
      contactShadowBlur: 3.2,
    },
    colorManagement: {
      toneMapping: "aces-filmic",
      outputColorSpace: "srgb",
      exposure: 1.18,
      shadowMap: "pcf-soft",
    },
  },
  {
    id: "moody-walnut",
    version: 1,
    name: "Moody Walnut",
    description: "Deep walnut, mineral walls and a warm evening light rig.",
    swatches: ["#43291e", "#817d73", "#a99884"],
    lightingRecipeId: "warm-evening",
    materialRecipes: {
      [LIVING_ROOM_MATERIAL_IDS.wallPaint]: materialRecipe("#817d73", 0.88),
      [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: materialRecipe("#d9d2c7", 0.92),
      [LIVING_ROOM_MATERIAL_IDS.naturalOak]: materialRecipe("#96734e", 0.6),
      [LIVING_ROOM_MATERIAL_IDS.walnut]: materialRecipe("#43291e", 0.5),
      [LIVING_ROOM_MATERIAL_IDS.oatmealFabric]: materialRecipe("#a99884", 0.97),
      [LIVING_ROOM_MATERIAL_IDS.oliveFabric]: materialRecipe("#555d48", 0.98),
      [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: materialRecipe("#1d2020", 0.28, 0.78),
      [LIVING_ROOM_MATERIAL_IDS.clearGlass]: materialRecipe("#aebfc1", 0.1, 0, 0.28),
      [LIVING_ROOM_MATERIAL_IDS.woolRug]: materialRecipe("#756d62", 1),
    },
    environment: {
      backgroundColor: "#54575a",
      fogColor: "#54575a",
      fogNearMm: 9000,
      fogFarMm: 19000,
      hemisphereSkyColor: "#9aa6b0",
      hemisphereGroundColor: "#3f3128",
      hemisphereIntensity: 0.2,
      gridPrimaryColor: "#747c80",
      gridSecondaryColor: "#596165",
      contactShadowOpacity: 0.42,
      contactShadowBlur: 2.3,
    },
    colorManagement: {
      toneMapping: "aces-filmic",
      outputColorSpace: "srgb",
      exposure: 0.92,
      shadowMap: "pcf-soft",
    },
  },
] as const satisfies readonly LivingRoomStylePreset[];

const STYLE_BY_ID = new Map(
  LIVING_ROOM_STYLE_PRESETS.map((preset) => [preset.id, preset]),
);

export function getLivingRoomStylePreset(id: LivingRoomStyleId) {
  return STYLE_BY_ID.get(id)!;
}

export function getActiveLivingRoomStyleId(
  project: InteriorProject,
): LivingRoomStyleId {
  const snapshot = project.extensions?.livingRoomStyle;
  const candidate = snapshot && typeof snapshot === "object"
    ? (snapshot as Record<string, unknown>).id
    : project.extensions?.livingRoomStyleId;
  return typeof candidate === "string" && STYLE_BY_ID.has(candidate as LivingRoomStyleId)
    ? candidate as LivingRoomStyleId
    : "warm-contemporary";
}

export function resolveLivingRoomStyle(project: InteriorProject) {
  return getLivingRoomStylePreset(getActiveLivingRoomStyleId(project));
}

function styleSnapshot(project: InteriorProject) {
  const value = project.extensions?.livingRoomStyle;
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
}

function safeEnvironmentValue<T extends keyof LivingRoomEnvironment>(
  candidate: Record<string, unknown>,
  key: T,
  fallback: LivingRoomEnvironment[T],
) {
  const value = candidate[key];
  return typeof value === typeof fallback ? value as LivingRoomEnvironment[T] : fallback;
}

export function resolveLivingRoomEnvironment(
  project: InteriorProject,
): LivingRoomEnvironment {
  const fallback = resolveLivingRoomStyle(project).environment;
  const value = styleSnapshot(project)?.environment;
  if (!value || typeof value !== "object") return { ...fallback };
  const candidate = value as Record<string, unknown>;
  return {
    backgroundColor: safeEnvironmentValue(candidate, "backgroundColor", fallback.backgroundColor),
    fogColor: safeEnvironmentValue(candidate, "fogColor", fallback.fogColor),
    fogNearMm: safeEnvironmentValue(candidate, "fogNearMm", fallback.fogNearMm),
    fogFarMm: safeEnvironmentValue(candidate, "fogFarMm", fallback.fogFarMm),
    hemisphereSkyColor: safeEnvironmentValue(candidate, "hemisphereSkyColor", fallback.hemisphereSkyColor),
    hemisphereGroundColor: safeEnvironmentValue(candidate, "hemisphereGroundColor", fallback.hemisphereGroundColor),
    hemisphereIntensity: safeEnvironmentValue(candidate, "hemisphereIntensity", fallback.hemisphereIntensity),
    gridPrimaryColor: safeEnvironmentValue(candidate, "gridPrimaryColor", fallback.gridPrimaryColor),
    gridSecondaryColor: safeEnvironmentValue(candidate, "gridSecondaryColor", fallback.gridSecondaryColor),
    contactShadowOpacity: safeEnvironmentValue(candidate, "contactShadowOpacity", fallback.contactShadowOpacity),
    contactShadowBlur: safeEnvironmentValue(candidate, "contactShadowBlur", fallback.contactShadowBlur),
  };
}

export function resolveLivingRoomColorManagement(
  project: InteriorProject,
): LivingRoomColorManagement {
  const fallback = resolveLivingRoomStyle(project).colorManagement;
  return {
    ...fallback,
    exposure: project.renderSettings.exposure,
  };
}

function applyMaterialRecipes(
  project: InteriorProject,
  preset: LivingRoomStylePreset,
) {
  const semanticMaterials = new Map(
    createLivingRoomMaterials().map((material) => [material.id, material]),
  );
  const existingMaterials = new Map(
    project.materials.map((material) => [material.id, material]),
  );
  const styled = [...semanticMaterials.values()].map((base) => {
    const existing = existingMaterials.get(base.id);
    const recipe = preset.materialRecipes[base.id];
    return {
      ...base,
      ...existing,
      ...recipe,
      extensions: {
        ...base.extensions,
        ...existing?.extensions,
        stylePresetId: preset.id,
        stylePresetVersion: preset.version,
      },
    };
  });
  const semanticIds = new Set(semanticMaterials.keys());
  return [
    ...styled,
    ...project.materials.filter((material) => !semanticIds.has(material.id)),
  ];
}

/** Apply one complete visual language while retaining custom project entities. */
export function applyLivingRoomStyle(
  project: InteriorProject,
  styleId: LivingRoomStyleId,
): InteriorProject {
  const preset = getLivingRoomStylePreset(styleId);
  const litProject = applyLivingRoomLightingRecipe(project, preset.lightingRecipeId);
  return {
    ...litProject,
    materials: applyMaterialRecipes(project, preset),
    renderSettings: {
      ...litProject.renderSettings,
      exposure: preset.colorManagement.exposure,
    },
    extensions: {
      ...project.extensions,
      livingRoomStyleId: preset.id,
      livingRoomStyle: {
        id: preset.id,
        version: preset.version,
        environment: { ...preset.environment },
        colorManagement: { ...preset.colorManagement },
      },
    },
  };
}
