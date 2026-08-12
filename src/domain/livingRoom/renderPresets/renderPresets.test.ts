import { describe, expect, it } from "vitest";
import {
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  validateInteriorProject,
} from "../../interiorProject";
import {
  applyRenderPresetToSettings,
  createLivingRoomStarterProject,
  getModelViewDefaultPresetId,
  getRenderPresetBehavior,
  listModelViewRenderPresets,
  listRenderPresetBehaviors,
  RENDER_PRESET_IDS,
  RENDER_QUALITY_PRESETS,
  resolveHeroRenderScale,
  resolveStudioRenderMode,
} from "..";

const NOW = "2026-08-12T21:30:00.000Z";

describe("render preset system", () => {
  it("exposes Draft, Standard, Presentation, and Client Preview", () => {
    expect(RENDER_PRESET_IDS).toEqual([
      "draft",
      "standard",
      "presentation",
      "client-preview",
    ]);
    expect(RENDER_QUALITY_PRESETS.map((preset) => preset.id)).toEqual([
      ...RENDER_PRESET_IDS,
    ]);
    expect(listRenderPresetBehaviors()).toHaveLength(4);
  });

  it("defines per-preset renderMode, resolution, and quality knobs", () => {
    const draft = getRenderPresetBehavior("draft");
    const client = getRenderPresetBehavior("client-preview");
    expect(draft.renderMode).toBe("preview");
    expect(draft.textureDetail).toBe("low");
    expect(draft.allowTransparentBackground).toBe(false);
    expect(client.renderMode).toBe("hero");
    expect(client.textureDetail).toBe("high");
    expect(client.widthPx).toBe(1920);
    expect(client.pixelRatio).toBeGreaterThan(getRenderPresetBehavior("standard").pixelRatio);
    expect(client.shadowMapSize).toBeLessThan(getRenderPresetBehavior("presentation").shadowMapSize);
    expect(resolveStudioRenderMode("draft")).toBe("preview");
    expect(resolveStudioRenderMode("client-preview")).toBe("hero");
  });

  it("keeps Model View fast by default and limits heavy presets", () => {
    expect(getModelViewDefaultPresetId()).toBe("draft");
    expect(listModelViewRenderPresets().map((preset) => preset.id)).toEqual([
      "draft",
      "standard",
    ]);
  });

  it("applies preset settings while staying backward compatible on load", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const next = applyRenderPresetToSettings(project.renderSettings, "client-preview");
    expect(next.quality).toBe("client-preview");
    expect(next.widthPx).toBe(1920);
    expect(next.heightPx).toBe(1080);

    const draftForced = applyRenderPresetToSettings(
      { ...project.renderSettings, transparentBackground: true },
      "draft",
    );
    expect(draftForced.transparentBackground).toBe(false);

    const legacy = {
      ...project,
      renderSettings: { ...project.renderSettings, quality: "presentation" as const },
    };
    const loaded = loadInteriorProjectFile(serializeInteriorProjectFile(legacy, NOW));
    expect(loaded.document.renderSettings.quality).toBe("presentation");

    const withClient = {
      ...project,
      renderSettings: next,
    };
    expect(validateInteriorProject(withClient).project.renderSettings.quality).toBe("client-preview");
    expect(resolveHeroRenderScale("hero", "client-preview")).toBeGreaterThan(
      resolveHeroRenderScale("preview", "client-preview"),
    );
  });

  it("falls back unknown quality ids to standard behavior", () => {
    expect(getRenderPresetBehavior("nope" as never).id).toBe("standard");
  });
});
