import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig, type CabinetConfig } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { doorGlassSquareMetres } from "../cabinetConstruction/partsDoors";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { createCabinetGeometry, isFrontLeafPanel } from "../cabinetGeometry";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { buildHardwareLines } from "../hardwareSystem";
import { DOOR_PANEL_GROOVE_MM, type DoorFrontStyle } from "./doorStyles";
import { applyFrontSystemParameters } from "./frontSystemParameters";

function styled(frontStyle: DoorFrontStyle | undefined): CabinetConfig {
  const config = getDefaultCabinetConfig("base");
  return clampCabinetConfig({ ...config, construction: { ...normalizeConstructionSpec("base", config.construction), frontStyle } });
}

const doorParts = (config: CabinetConfig) => createCabinetConstruction(config).parts.filter((part) => part.category === "Door");
const mm = (metres: number) => Math.round(metres * 1000);

describe("door styles", () => {
  it("maps doorStyle / doorSourcing parameters into the config, and slab clears it", () => {
    const base = getDefaultCabinetConfig("base");
    const shaker = applyFrontSystemParameters(base, { doorStyle: "shaker", doorSourcing: "in-house" });
    expect(normalizeConstructionSpec("base", shaker.construction).frontStyle).toEqual({ style: "shaker", sourcing: "in-house" });
    const glass = applyFrontSystemParameters(base, { doorStyle: "glass" });
    expect(normalizeConstructionSpec("base", glass.construction).frontStyle).toEqual({ style: "glass", sourcing: "bought" });
    const slab = applyFrontSystemParameters(shaker, { doorStyle: "slab" });
    expect(normalizeConstructionSpec("base", slab.construction).frontStyle).toBeUndefined();
    expect(applyFrontSystemParameters(base, {})).toBe(base);
  });

  it("bought shaker and glass keep the cut list identical to slab", () => {
    const slab = createCabinetConstruction(styled(undefined)).parts;
    expect(createCabinetConstruction(styled({ style: "shaker", sourcing: "bought" })).parts).toEqual(slab);
    expect(createCabinetConstruction(styled({ style: "glass", sourcing: "bought" })).parts).toEqual(slab);
  });

  it("shaker draws a leaf panel plus four frame pieces, and the leaf still equals the production door", () => {
    const config = styled({ style: "shaker", sourcing: "bought" });
    const panels = createCabinetGeometry(config);
    const leftDoor = panels.filter((panel) => panel.name.startsWith("left-door"));
    expect(leftDoor).toHaveLength(5);
    expect(leftDoor.filter((panel) => panel.name.includes("-frame-"))).toHaveLength(4);
    const leaf = panels.filter(isFrontLeafPanel).find((panel) => panel.name === "left-door")!;
    const [part] = doorParts(config);
    expect([mm(leaf.size[1]), mm(leaf.size[0])]).toEqual([part!.lengthMm, part!.widthMm]);
  });

  it("glass draws a transparent glass panel inside a frame", () => {
    const panels = createCabinetGeometry(styled({ style: "glass", sourcing: "bought" }));
    expect(panels.filter((panel) => panel.material === "glass").length).toBeGreaterThan(0);
    expect(panels.some((panel) => panel.name.includes("-frame-"))).toBe(true);
  });

  it("in-house shaker cuts two stiles, two rails and a grooved panel per leaf", () => {
    const config = styled({ style: "shaker", sourcing: "in-house" });
    const leaf = resolveFrontGaps(config).openings.find((entry) => entry.kind === "door")!.leaves[0]!;
    const { stileWidthMm: stile, railWidthMm: rail } = normalizeConstructionSpec("base", config.construction).faceFrame;
    const parts = doorParts(config);
    const leaves = resolveFrontGaps(config).openings.find((entry) => entry.kind === "door")!.leaves.length;
    const stiles = parts.find((part) => part.id.endsWith("-stile"))!;
    const rails = parts.find((part) => part.id.endsWith("-rail"))!;
    const panel = parts.find((part) => part.id.endsWith("-panel"))!;
    expect([stiles.quantity, stiles.lengthMm, stiles.widthMm]).toEqual([leaves * 2, leaf.heightMm, stile]);
    expect([rails.quantity, rails.lengthMm, rails.widthMm]).toEqual([leaves * 2, leaf.widthMm - stile * 2, rail]);
    expect([panel.quantity, panel.lengthMm, panel.widthMm]).toEqual([
      leaves, leaf.heightMm - rail * 2 + DOOR_PANEL_GROOVE_MM * 2, leaf.widthMm - stile * 2 + DOOR_PANEL_GROOVE_MM * 2,
    ]);
    expect(doorGlassSquareMetres(config)).toBe(0);
  });

  it("in-house glass cuts the frame only and puts the glass on the hardware list in m²", () => {
    const config = styled({ style: "glass", sourcing: "in-house" });
    const parts = doorParts(config);
    expect(parts.some((part) => part.id.endsWith("-panel"))).toBe(false);
    expect(parts.some((part) => part.id.endsWith("-stile"))).toBe(true);
    const area = doorGlassSquareMetres(config);
    expect(area).toBeGreaterThan(0);
    const cabinet = { id: "c", name: "c", config, placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" as const } };
    const glass = buildHardwareLines(cabinet, createCabinetConstruction(config), DEFAULT_COSTING_SETTINGS)
      .find((line) => line.kind === "glass");
    expect(glass?.quantity).toBeCloseTo(area, 6);
    expect(doorGlassSquareMetres(styled({ style: "glass", sourcing: "bought" }))).toBe(0);
  });
});
