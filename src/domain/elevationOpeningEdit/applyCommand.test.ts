import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { collectOpeningLeaves } from "../cabinetOpeningStructure";
import {
  applyElevationOpeningCommand,
  getElevationOpeningToolbarState,
} from "./index";

describe("elevationOpeningEdit", () => {
  it("reports split and content capabilities for base cabinets", () => {
    const config = getDefaultCabinetConfig("base");
    const state = getElevationOpeningToolbarState(config);
    expect(state.supportsOpenings).toBe(true);
    expect(state.canSplitVertical).toBe(true);
    expect(state.canSplitHorizontal).toBe(true);
    expect(state.allowedContentTypes).toContain("drawer-stack");
    expect(state.activeOpeningId).toBeTruthy();
  });

  it("splits the active opening vertically from elevation commands", () => {
    const config = getDefaultCabinetConfig("base");
    const next = applyElevationOpeningCommand(config, { kind: "split-vertical" });
    const structure = resolveCabinetComposition(next).openingStructure!;
    const leaves = collectOpeningLeaves(structure.root);
    expect(leaves).toHaveLength(2);
    expect(structure.activeOpeningId).toBe(leaves[0]?.id);
  });

  it("assigns drawer-stack content from elevation commands", () => {
    const config = getDefaultCabinetConfig("base");
    const next = applyElevationOpeningCommand(config, {
      kind: "set-content",
      contentType: "drawer-stack",
    });
    const leaf = resolveCabinetComposition(next).openingStructure!;
    const active = collectOpeningLeaves(leaf.root).find(
      (item) => item.id === leaf.activeOpeningId,
    );
    expect(active?.contentType).toBe("drawer-stack");
    expect(active?.drawerCount).toBeGreaterThan(0);
  });

  it("blocks horizontal split for wall cabinets", () => {
    const config = getDefaultCabinetConfig("wall");
    const state = getElevationOpeningToolbarState(config);
    expect(state.canSplitHorizontal).toBe(false);
    const next = applyElevationOpeningCommand(config, {
      kind: "split-horizontal",
    });
    expect(next).toBe(config);
  });

  it("blocks unsupported content types for drawer cabinets", () => {
    const config = getDefaultCabinetConfig("drawer");
    const state = getElevationOpeningToolbarState(config);
    expect(state.canSplitVertical).toBe(false);
    expect(state.allowedContentTypes).toEqual(["drawer-stack"]);
    const next = applyElevationOpeningCommand(config, {
      kind: "set-content",
      contentType: "door",
    });
    expect(next).toBe(config);
  });
});
