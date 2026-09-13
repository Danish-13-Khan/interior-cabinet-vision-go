import { describe, expect, it } from "vitest";
import {
  PLAN_TOOLBAR_SECONDARY_GROUPS,
  planToolbarEntryById,
  planToolbarEntryIds,
  planToolbarPrimaryEntries,
  planToolbarSecondaryEntries,
  planToolbarVisibleForArea,
} from "./planToolbar";

describe("planToolbar (Phase E)", () => {
  it("lists compact primary entries for the light drafting studio bar", () => {
    const primary = planToolbarPrimaryEntries().map((e) => e.id);
    expect(primary).toContain("measure");
    expect(primary).toContain("zoom-in");
    expect(primary).toContain("layers");
    expect(primary).toContain("export-sheet");
    expect(primary).not.toContain("calibrate");
  });

  it("keeps calibrate and fit-selection as secondary", () => {
    expect(planToolbarSecondaryEntries().map((e) => e.id)).toEqual([
      "calibrate",
      "fit-selection",
    ]);
  });

  it("exposes expandable room / openings / underlay / runs groups", () => {
    expect(PLAN_TOOLBAR_SECONDARY_GROUPS.map((g) => g.id)).toEqual([
      "room-settings", "openings", "underlay", "runs",
    ]);
  });

  it("hides the compact bar in Present and Review", () => {
    expect(planToolbarVisibleForArea("room")).toBe(true);
    expect(planToolbarVisibleForArea("cabinets")).toBe(true);
    expect(planToolbarVisibleForArea("materials")).toBe(true);
    expect(planToolbarVisibleForArea("review")).toBe(false);
    expect(planToolbarVisibleForArea("present")).toBe(false);
  });

  it("resolves entry metadata", () => {
    expect(planToolbarEntryById("fit").label).toBe("Fit");
    expect(planToolbarEntryIds().length).toBeGreaterThanOrEqual(10);
  });
});
