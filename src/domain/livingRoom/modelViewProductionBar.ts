import type { RenderQuality } from "../interiorProject";
import { exceedsFrameTimeBudget } from "./frameTimeStats";
import {
  getModelViewDefaultPresetId,
  resolveStudioRenderMode,
} from "./renderPresets";
import { resolveGlbCastShadow } from "./glbCastShadow";

/**
 * Phase H — production quality bar.
 * Default viewport stays Draft until a recorded §8.4 p95 gate passes
 * and product explicitly unlocks raising the default.
 */
export const MODEL_VIEW_DEFAULT_LOCKED_TO_DRAFT = true as const;

export type ModelViewProductionTrackId =
  | "model-view-standard"
  | "model-view-draft"
  | "client-package"
  | "desktop-web";

export type ModelViewProductionTrack = {
  id: ModelViewProductionTrackId;
  goal: string;
};

export const MODEL_VIEW_PRODUCTION_TRACKS = [
  {
    id: "model-view-standard",
    goal: "Grounded GLBs, readable materials, orbit stays responsive",
  },
  {
    id: "model-view-draft",
    goal: "Fast authoring; honest thinner lighting/shadows",
  },
  {
    id: "client-package",
    goal: "Unchanged Studio hero + Phase 2 for wow frames",
  },
  {
    id: "desktop-web",
    goal: "Meet interactive §8.4 p95 budget before raising defaults",
  },
] as const satisfies readonly ModelViewProductionTrack[];

/** Always Draft while the production lock is on — do not raise silently. */
export function resolveModelViewDefaultQuality(): RenderQuality {
  if (MODEL_VIEW_DEFAULT_LOCKED_TO_DRAFT) return "draft";
  return getModelViewDefaultPresetId();
}

/**
 * Whether product may raise Model View default to Standard.
 * Requires unlock flag off + recorded p95 within budget (roadmap §8.4 / §7.9).
 */
export function canRaiseModelViewDefaultToStandard(args: {
  defaultUnlocked?: boolean;
  baselineP95Ms: number;
  measuredP95Ms: number;
  absoluteCeilingMs?: number;
}): boolean {
  if (MODEL_VIEW_DEFAULT_LOCKED_TO_DRAFT && !args.defaultUnlocked) return false;
  return !exceedsFrameTimeBudget({
    baselineP95Ms: args.baselineP95Ms,
    measuredP95Ms: args.measuredP95Ms,
    absoluteCeilingMs: args.absoluteCeilingMs,
  });
}

/** CastShadow acceptance matrix row for Phase H / §8.0–8.2. */
export type GlbCastShadowAcceptanceRow = {
  id: string;
  renderMode: "preview" | "hero";
  modelViewPreview: boolean;
  modelViewQuality: RenderQuality | null;
  expectCast: boolean;
};

export function listGlbCastShadowAcceptanceRows(): GlbCastShadowAcceptanceRow[] {
  return [
    {
      id: "model-view-draft",
      renderMode: "preview",
      modelViewPreview: true,
      modelViewQuality: "draft",
      expectCast: false,
    },
    {
      id: "model-view-standard",
      renderMode: "preview",
      modelViewPreview: true,
      modelViewQuality: "standard",
      expectCast: true,
    },
    {
      id: "studio-draft",
      renderMode: resolveStudioRenderMode("draft"),
      modelViewPreview: false,
      modelViewQuality: null,
      expectCast: false,
    },
    {
      id: "studio-standard",
      renderMode: resolveStudioRenderMode("standard"),
      modelViewPreview: false,
      modelViewQuality: null,
      expectCast: true,
    },
    {
      id: "studio-presentation",
      renderMode: resolveStudioRenderMode("presentation"),
      modelViewPreview: false,
      modelViewQuality: null,
      expectCast: true,
    },
    {
      id: "studio-client-preview",
      renderMode: resolveStudioRenderMode("client-preview"),
      modelViewPreview: false,
      modelViewQuality: null,
      expectCast: true,
    },
    {
      id: "forced-hero",
      renderMode: "hero",
      modelViewPreview: false,
      modelViewQuality: null,
      expectCast: true,
    },
  ];
}

export function evaluateGlbCastShadowAcceptanceRow(
  row: GlbCastShadowAcceptanceRow,
): boolean {
  return resolveGlbCastShadow({
    renderMode: row.renderMode,
    modelViewPreview: row.modelViewPreview,
    modelViewQuality: row.modelViewQuality,
    glbCasterSlot: 0,
  }) === row.expectCast;
}
