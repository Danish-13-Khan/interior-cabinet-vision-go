import { describe, expect, it } from "vitest";
import {
  clampShortcutMap,
  DEFAULT_SHORTCUT_MAP,
  formatShortcutBinding,
  MODEL_VIEW_SHORTCUT_ACTION_IDS,
  shortcutActionsInGroup,
} from "./shortcutMap";

describe("shortcutMapCatalog", () => {
  it("includes Interiors measure, orbit, and wall visibility defaults", () => {
    expect(formatShortcutBinding(DEFAULT_SHORTCUT_MAP.measureTool)).toBe("M");
    expect(formatShortcutBinding(DEFAULT_SHORTCUT_MAP.modelCamOrbit)).toBe("O");
    expect(formatShortcutBinding(DEFAULT_SHORTCUT_MAP.hideSelectedWall)).toBe("Alt+H");
    expect(formatShortcutBinding(DEFAULT_SHORTCUT_MAP.showAllWalls)).toBe("Alt+Shift+H");
  });

  it("keeps orbit among model-canvas-focused actions", () => {
    expect(MODEL_VIEW_SHORTCUT_ACTION_IDS).toContain("modelCamOrbit");
  });

  it("merges missing keys from defaults when loading older maps", () => {
    const merged = clampShortcutMap({ measureTool: { key: "t" } });
    expect(merged.measureTool.key).toBe("t");
    expect(merged.modelCamOrbit.key).toBe("o");
    expect(merged.hideSelectedWall.alt).toBe(true);
  });

  it("groups plan and model actions for the shortcut sheet", () => {
    expect(shortcutActionsInGroup("plan")).toContain("measureTool");
    expect(shortcutActionsInGroup("model")).toContain("modelCamOrbit");
  });
});
