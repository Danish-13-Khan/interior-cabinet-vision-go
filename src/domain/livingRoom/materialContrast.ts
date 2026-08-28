import type { MaterialKind, RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";

export type MaterialContrastTuning = {
  roughnessDelta: number;
  envBoost: number;
  clearcoatBoost: number;
  sheenBoost: number;
  specularBoost: number;
  bumpBoost: number;
};

const NEUTRAL: MaterialContrastTuning = {
  roughnessDelta: 0,
  envBoost: 1,
  clearcoatBoost: 1,
  sheenBoost: 1,
  specularBoost: 1,
  bumpBoost: 1,
};

function isRichHero(mode: RenderMode, quality?: RenderQuality) {
  return mode === "hero" && quality !== "draft";
}

function isClientGrade(quality?: RenderQuality) {
  return quality === "client-preview" || quality === "presentation";
}

/**
 * Kind-aware contrast so wood/fabric/floor separate under hero lighting.
 * Paint stays flatter so millwork and soft goods read first.
 */
export function resolveMaterialContrast(
  kind: MaterialKind | "custom" | string,
  mode: RenderMode,
  quality?: RenderQuality,
  modelViewPreview?: boolean,
): MaterialContrastTuning {
  const rich = isRichHero(mode, quality);
  const client = isClientGrade(quality);
  const designed = modelViewPreview && mode === "preview";

  if (kind === "wood" || kind === "laminate") {
    return {
      roughnessDelta: designed ? -0.018 : rich ? (client ? -0.07 : -0.045) : mode === "hero" ? -0.02 : 0.015,
      envBoost: designed ? 1.06 : rich ? (client ? 1.22 : 1.12) : mode === "preview" ? 0.95 : 1.04,
      clearcoatBoost: rich ? (client ? 1.28 : 1.16) : 1,
      sheenBoost: 1,
      specularBoost: rich ? (client ? 1.16 : 1.08) : 1,
      bumpBoost: rich ? (client ? 1.22 : 1.12) : 1,
    };
  }

  if (kind === "fabric") {
    return {
      roughnessDelta: designed ? 0.01 : rich ? 0.015 : 0.03,
      envBoost: designed ? 0.88 : rich ? 0.9 : 0.82,
      clearcoatBoost: 1,
      sheenBoost: designed ? 1.12 : rich ? (client ? 1.32 : 1.18) : 1.05,
      specularBoost: rich ? 0.88 : 0.8,
      bumpBoost: rich ? 1.12 : 1,
    };
  }

  if (kind === "paint") {
    return {
      roughnessDelta: rich ? 0.05 : 0.03,
      envBoost: rich ? 0.82 : 0.78,
      clearcoatBoost: rich ? 0.7 : 0.85,
      sheenBoost: 1,
      specularBoost: rich ? 0.85 : 0.9,
      bumpBoost: rich ? 0.85 : 0.9,
    };
  }

  if (kind === "metal") {
    return {
      roughnessDelta: rich ? -0.04 : 0,
      envBoost: rich ? (client ? 1.18 : 1.1) : 1,
      clearcoatBoost: 1,
      sheenBoost: 1,
      specularBoost: rich ? 1.1 : 1,
      bumpBoost: 1,
    };
  }

  if (kind === "glass") {
    return {
      roughnessDelta: rich ? -0.02 : 0,
      envBoost: rich ? 1.08 : 1,
      clearcoatBoost: 1,
      sheenBoost: 1,
      specularBoost: 1,
      bumpBoost: 1,
    };
  }

  return NEUTRAL;
}

export function applyMaterialContrastRoughness(
  base: number,
  tuning: MaterialContrastTuning,
) {
  return Math.min(1, Math.max(0.02, base + tuning.roughnessDelta));
}
