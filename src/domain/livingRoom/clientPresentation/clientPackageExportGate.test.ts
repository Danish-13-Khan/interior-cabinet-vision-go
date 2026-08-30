import { describe, expect, it } from "vitest";
import type { LivingRoomPlanIssue } from "../planConstraints";
import { isClientPackageExportBlocked } from "./clientPackageExportGate";

const blocking: LivingRoomPlanIssue = {
  code: "overlap",
  severity: "error",
  objectIds: ["a", "b"],
  message: "A overlaps B.",
};

const advisory: LivingRoomPlanIssue = {
  code: "circulation",
  severity: "warning",
  objectIds: ["a"],
  message: "Tight clearance.",
};

describe("isClientPackageExportBlocked", () => {
  it("blocks on layout errors or missing millwork", () => {
    expect(isClientPackageExportBlocked([blocking], true)).toBe(true);
    expect(isClientPackageExportBlocked([], false)).toBe(true);
    expect(isClientPackageExportBlocked([advisory], true)).toBe(false);
    expect(isClientPackageExportBlocked([], true)).toBe(false);
  });

  it("blocks client package export when fallback cabinet geometry is present", () => {
    expect(isClientPackageExportBlocked([], true, { geometryFallbackIds: ["golden-base"] })).toBe(true);
    expect(isClientPackageExportBlocked([], true, { geometryFallbackIds: [] })).toBe(false);
  });
});
