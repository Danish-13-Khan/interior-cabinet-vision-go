import {
  DEFAULT_BUILD_RULES,
  EDGE_BANDING_OPTIONS,
  FINISHES,
  MATERIAL_PRESETS,
  type EdgeBandingId,
  type FinishId,
  type MaterialPresetId,
} from "./materialSystem";

export type ProjectStandards = {
  carcassThicknessMm: number;
  backPanelThicknessMm: number;
  shelfThicknessMm: number;
  drawerBoxThicknessMm: number;
  toeKickHeightMm: number;
  toeKickInsetMm: number;
  materialPresetId: MaterialPresetId;
  finishId: FinishId;
  edgeBandingId: EdgeBandingId;
};

export const DEFAULT_PROJECT_STANDARDS: ProjectStandards = {
  carcassThicknessMm: DEFAULT_BUILD_RULES.carcassThicknessMm,
  backPanelThicknessMm: DEFAULT_BUILD_RULES.backPanelThicknessMm,
  shelfThicknessMm: DEFAULT_BUILD_RULES.shelfThicknessMm,
  drawerBoxThicknessMm: DEFAULT_BUILD_RULES.drawerBoxThicknessMm,
  toeKickHeightMm: 100,
  toeKickInsetMm: 60,
  materialPresetId: DEFAULT_BUILD_RULES.materialPresetId,
  finishId: DEFAULT_BUILD_RULES.finishId,
  edgeBandingId: DEFAULT_BUILD_RULES.edgeBandingId,
};

const CARCASS_THICKNESSES = new Set([16, 18, 25]);
const BACK_THICKNESSES = new Set([3, 6, 8]);
const SHELF_THICKNESSES = new Set([16, 18, 25]);
const DRAWER_THICKNESSES = new Set([12, 16, 18]);
const MATERIAL_IDS = new Set(MATERIAL_PRESETS.map((preset) => preset.id));
const FINISH_IDS = new Set(FINISHES.map((finish) => finish.id));
const EDGE_IDS = new Set(EDGE_BANDING_OPTIONS.map((option) => option.id));

function pickNumber(value: unknown, fallback: number, allowed: Set<number>): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const rounded = Math.round(numeric);
  return allowed.has(rounded) ? rounded : fallback;
}

export function clampProjectStandards(
  settings: Partial<ProjectStandards> | undefined,
): ProjectStandards {
  const seed = {
    ...DEFAULT_PROJECT_STANDARDS,
    ...(settings ?? {}),
  };

  const toeKickHeight = Number(seed.toeKickHeightMm);
  const toeKickInset = Number(seed.toeKickInsetMm);

  return {
    carcassThicknessMm: pickNumber(
      seed.carcassThicknessMm,
      DEFAULT_PROJECT_STANDARDS.carcassThicknessMm,
      CARCASS_THICKNESSES,
    ),
    backPanelThicknessMm: pickNumber(
      seed.backPanelThicknessMm,
      DEFAULT_PROJECT_STANDARDS.backPanelThicknessMm,
      BACK_THICKNESSES,
    ),
    shelfThicknessMm: pickNumber(
      seed.shelfThicknessMm,
      DEFAULT_PROJECT_STANDARDS.shelfThicknessMm,
      SHELF_THICKNESSES,
    ),
    drawerBoxThicknessMm: pickNumber(
      seed.drawerBoxThicknessMm,
      DEFAULT_PROJECT_STANDARDS.drawerBoxThicknessMm,
      DRAWER_THICKNESSES,
    ),
    toeKickHeightMm: Number.isFinite(toeKickHeight)
      ? Math.min(180, Math.max(0, Math.round(toeKickHeight)))
      : DEFAULT_PROJECT_STANDARDS.toeKickHeightMm,
    toeKickInsetMm: Number.isFinite(toeKickInset)
      ? Math.min(120, Math.max(0, Math.round(toeKickInset)))
      : DEFAULT_PROJECT_STANDARDS.toeKickInsetMm,
    materialPresetId: MATERIAL_IDS.has(seed.materialPresetId)
      ? seed.materialPresetId
      : DEFAULT_PROJECT_STANDARDS.materialPresetId,
    finishId: FINISH_IDS.has(seed.finishId)
      ? seed.finishId
      : DEFAULT_PROJECT_STANDARDS.finishId,
    edgeBandingId: EDGE_IDS.has(seed.edgeBandingId)
      ? seed.edgeBandingId
      : DEFAULT_PROJECT_STANDARDS.edgeBandingId,
  };
}
