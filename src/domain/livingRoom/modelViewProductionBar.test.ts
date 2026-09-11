import { describe, expect, it } from "vitest";
import {
  MODEL_VIEW_DEFAULT_LOCKED_TO_DRAFT,
  MODEL_VIEW_PRODUCTION_TRACKS,
  canRaiseModelViewDefaultToStandard,
  evaluateGlbCastShadowAcceptanceRow,
  listGlbCastShadowAcceptanceRows,
  resolveModelViewDefaultQuality,
} from "./modelViewProductionBar";
import { getModelViewDefaultPresetId } from "./renderPresets";
import {
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  resolveModelViewLightingQuality,
} from "./modelViewPreviewDefaults";
import { resolveEnvironmentLightingQuality } from "./environmentLightingQuality";
import { getRenderModeQuality } from "./heroRenderQuality";

describe("modelViewProductionBar Phase H", () => {
  it("keeps Model View default locked to Draft", () => {
    expect(MODEL_VIEW_DEFAULT_LOCKED_TO_DRAFT).toBe(true);
    expect(resolveModelViewDefaultQuality()).toBe("draft");
    expect(getModelViewDefaultPresetId()).toBe("draft");
  });

  it("blocks raising default to Standard without unlock + p95 gate", () => {
    expect(
      canRaiseModelViewDefaultToStandard({
        baselineP95Ms: 16,
        measuredP95Ms: 18,
      }),
    ).toBe(false);
    expect(
      canRaiseModelViewDefaultToStandard({
        defaultUnlocked: true,
        baselineP95Ms: 16,
        measuredP95Ms: 18,
      }),
    ).toBe(true);
    expect(
      canRaiseModelViewDefaultToStandard({
        defaultUnlocked: true,
        baselineP95Ms: 16,
        measuredP95Ms: 22,
      }),
    ).toBe(false);
  });

  it("documents the four production tracks", () => {
    expect(MODEL_VIEW_PRODUCTION_TRACKS.map((track) => track.id)).toEqual([
      "model-view-standard",
      "model-view-draft",
      "client-package",
      "desktop-web",
    ]);
  });

  it("passes the §8 castShadow acceptance matrix", () => {
    for (const row of listGlbCastShadowAcceptanceRows()) {
      expect(evaluateGlbCastShadowAcceptanceRow(row), row.id).toBe(true);
    }
  });

  it("keeps Draft thinner than Standard and Studio hero separate", () => {
    const draft = describeModelViewRuntimeProfile("draft");
    const standard = describeModelViewRuntimeProfile("standard");
    expect(draft.glbCastShadow).toBe(false);
    expect(standard.glbCastShadow).toBe(true);
    expect(draft.maxGlbCasters).toBe(0);
    expect(standard.maxGlbCasters).toBeGreaterThan(0);
    expect(draft.defaultQualityLocked).toBe(true);
    expect(standard.frameloop).toBe("demand");

    const studio = resolveEnvironmentLightingQuality("hero", "standard");
    const mv = resolveModelViewLightingQuality("standard");
    expect(mv.projectShadow).toBeDefined();
    expect(studio.projectShadow).toBeUndefined();

    const honesty = describeModelViewHonesty("draft");
    expect(honesty.subline).toMatch(/not client export/i);
    expect(honesty.shortBadge).not.toContain("HERO");

    expect(getRenderModeQuality("hero", "client-preview").mode).toBe("hero");
  });
});
