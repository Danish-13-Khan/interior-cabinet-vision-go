import { describe, expect, it } from "vitest";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { clampCabinetConfig, type CabinetConfig } from "../cabinetDimensions";
import { createCabinetGeometry } from "../cabinetGeometry";
import { splitOpening } from "../cabinetOpeningStructure/operations";
import { renderElevationFaceGraphics } from "../elevationFace";
import { applyFrontSystemParameters } from "./frontSystemParameters";
import { hingedParametersPatch } from "./slidingSpec";
import { hardwareFor, slidingWardrobe } from "./slidingTestSupport";

/** Wardrobe with a 2-drawer stack under the hanging space (drawer over door split). */
function withDrawers(config: CabinetConfig): CabinetConfig {
  const clamped = clampCabinetConfig(config);
  const structure = clamped.composition!.openingStructure!;
  const split = splitOpening(structure, structure.root.id, "horizontal", "almirah", clamped.dimensions.width);
  return { ...clamped, composition: { ...clamped.composition!, openingStructure: split } };
}

function elevationSvg(config: CabinetConfig) {
  const cabinet = { id: "w", name: "Wardrobe", config, placement: { x: 0, y: 0, z: 0, rotation: 0 as const, attachment: "floor" as const } };
  return renderElevationFaceGraphics(cabinet, 0, 0, config.dimensions.width, config.dimensions.height, { scale: 1, showDetails: true }).join("");
}

const handles = (config: CabinetConfig) => createCabinetGeometry(config).filter((panel) => panel.name.startsWith("handle-"));

describe("Phase 3: drawers inside a sliding wardrobe have no protruding handle", () => {
  const sliding = withDrawers(slidingWardrobe(1800));
  const hinged = withDrawers(applyFrontSystemParameters(slidingWardrobe(1800), hingedParametersPatch()));

  it("resolver marks the drawer fronts behind the shutters handle-free", () => {
    const drawers = resolveFrontGaps(sliding).openings.filter((entry) => entry.kind === "drawer");
    expect(drawers.flatMap((entry) => entry.leaves)).toHaveLength(2);
    for (const leaf of drawers.flatMap((entry) => entry.leaves)) expect(leaf.behindSliding).toBe(true);
  });

  it("3D, elevation and hardware schedule agree: no handles, drawer slides kept", () => {
    expect(handles(sliding)).toEqual([]);
    const lines = hardwareFor(sliding);
    expect(lines.filter((line) => line.kind === "handle")).toEqual([]);
    expect(lines.find((line) => line.kind === "slide")?.quantity).toBe(2);
    const svg = elevationSvg(sliding);
    expect(svg).toContain("twod-sliding-leaf");
    expect(svg).not.toContain("twod-drawer-pull");
  });

  it("the same wardrobe hinged keeps a handle on every door and drawer", () => {
    expect(handles(hinged)).toHaveLength(4);
    expect(hardwareFor(hinged).find((line) => line.kind === "handle")?.quantity).toBe(4);
    expect(elevationSvg(hinged)).toContain("twod-drawer-pull");
  });
});
