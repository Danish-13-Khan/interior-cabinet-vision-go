import { describe, expect, it } from "vitest";
import {
  clampDesktopLayout,
  clampShortcutMap,
  createRecentFileEntry,
  eventMatchesBinding,
  formatShortcutBinding,
  rankCommands,
  scoreCommandMatch,
  upsertRecentCommandId,
  upsertRecentFile,
} from "./desktopUx/index";

describe("desktopUx layout", () => {
  it("clamps pane widths into safe bounds", () => {
    const layout = clampDesktopLayout({
      toolRailWidthPx: 40,
      inspectorWidthPx: 900,
      workspaceTab: "front",
    });
    expect(layout.toolRailWidthPx).toBe(160);
    expect(layout.inspectorWidthPx).toBe(480);
    expect(layout.workspaceTab).toBe("front");
  });

  it("defaults to compressed CAD dock widths", () => {
    const defaults = clampDesktopLayout({});
    expect(defaults.toolRailWidthPx).toBe(176);
    expect(defaults.inspectorWidthPx).toBe(236);
    expect(defaults.statusDockHeightPx).toBe(200);
  });

  it("defaults and clamps workspace split percentages", () => {
    const defaults = clampDesktopLayout({});
    expect(defaults.splitPlanWidthPct).toBe(50);
    expect(defaults.splitTopRowPct).toBe(68);
    expect(defaults.sceneBrowserVisible).toBe(true);
    expect(defaults.splitTopRowPct).toBeGreaterThan(50);

    const clamped = clampDesktopLayout({
      splitPlanWidthPct: 5,
      splitTopRowPct: 99,
      sceneBrowserVisible: false,
    });
    expect(clamped.splitPlanWidthPct).toBe(28);
    expect(clamped.splitTopRowPct).toBe(72);
    expect(clamped.sceneBrowserVisible).toBe(false);
  });
});

describe("desktopUx shortcuts", () => {
  it("matches configurable bindings and formats labels", () => {
    const map = clampShortcutMap({
      save: { key: "s", meta: true, ctrl: true },
    });
    expect(formatShortcutBinding(map.save)).toContain("S");
    expect(
      eventMatchesBinding(
        { key: "s", metaKey: true, ctrlKey: false, shiftKey: false, altKey: false },
        map.save,
      ),
    ).toBe(true);
  });
});

describe("desktopUx recent files", () => {
  it("upserts paths with newest first", () => {
    const first = upsertRecentFile([], "/a/one.json");
    const second = upsertRecentFile(first, "/b/two.json");
    expect(second[0]?.name).toBe("two.json");
    expect(createRecentFileEntry("/x/y.json").name).toBe("y.json");
  });
});

describe("desktopUx command search", () => {
  it("ranks fuzzy matches and recent commands", () => {
    const commands = [
      { id: "save", label: "Save Project", hint: "disk", shortcut: "S" },
      { id: "new", label: "New Project", hint: "reset", shortcut: "N" },
      { id: "grid", label: "Toggle Grid", hint: "viewport", shortcut: "G" },
    ];
    expect(scoreCommandMatch(commands[0]!, "sav")).toBeGreaterThan(0);
    expect(rankCommands(commands, "grid")[0]?.id).toBe("grid");
    expect(upsertRecentCommandId(["new"], "save")[0]).toBe("save");
    expect(rankCommands(commands, "", ["save"])[0]?.id).toBe("save");
  });
});
