import { describe, expect, it } from "vitest";
import { clampCabinetConfig, getDefaultCabinetConfig, type CabinetConfig, type CabinetType } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { defaultGolaProfiles, type FrontSystem } from "../frontSystem";
import { buildHardwareLines } from "../hardwareSystem";
import { createCabinetGeometry } from ".";

const GOLA: FrontSystem = { kind: "gola", profiles: defaultGolaProfiles() };

function withFronts(type: CabinetType, frontSystem: FrontSystem): CabinetConfig {
  const config = getDefaultCabinetConfig(type);
  return clampCabinetConfig({ ...config, construction: { ...normalizeConstructionSpec(type, config.construction), frontSystem } });
}

const handles = (config: CabinetConfig) => createCabinetGeometry(config).filter((panel) => panel.name.startsWith("handle-"));

function scheduledHandles(config: CabinetConfig): number {
  const cabinet = { id: "c", name: "c", config, placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" as const } };
  return buildHardwareLines(cabinet, createCabinetConstruction(config), DEFAULT_COSTING_SETTINGS)
    .filter((line) => line.kind === "handle")
    .reduce((sum, line) => sum + line.quantity, 0);
}

describe("3D handles", () => {
  it("3D handle count equals the hardware schedule for handled and gola fronts", () => {
    for (const type of ["base", "drawer", "wall", "tall", "sink"] as CabinetType[]) {
      for (const system of [{ kind: "handled" } as FrontSystem, GOLA]) {
        const config = withFronts(type, system);
        expect(handles(config), `${type} ${system.kind}`).toHaveLength(scheduledHandles(config));
      }
    }
  });

  it("gola drawers and base doors draw no handles; a tall gola door keeps its handle", () => {
    expect(handles(withFronts("drawer", GOLA))).toHaveLength(0);
    expect(handles(withFronts("base", GOLA))).toHaveLength(0);
    expect(handles(withFronts("tall", GOLA)).length).toBeGreaterThan(0);
  });

  it("handles are metal, sit proud of the front, and none means none", () => {
    const config = getDefaultCabinetConfig("base");
    const drawn = handles(config);
    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every((panel) => panel.material === "metal")).toBe(true);
    const door = createCabinetGeometry(config).find((panel) => panel.name === "left-door")!;
    expect(drawn[0]!.position[2]).toBeGreaterThan(door.position[2]);
    expect(handles({ ...config, hardware: { ...config.hardware!, handleId: "none" } })).toHaveLength(0);
  });

  it("bars stand vertical on doors and lie horizontal on drawers", () => {
    const [doorBar] = handles(getDefaultCabinetConfig("base"));
    expect(doorBar!.size[1]).toBeGreaterThan(doorBar!.size[0]);
    const [drawerBar] = handles(getDefaultCabinetConfig("drawer"));
    expect(drawerBar!.size[0]).toBeGreaterThan(drawerBar!.size[1]);
  });

  it("double doors put the handles on the meeting edges, away from the hinges", () => {
    const panels = createCabinetGeometry(getDefaultCabinetConfig("base"));
    const left = panels.find((panel) => panel.name === "left-door")!;
    const right = panels.find((panel) => panel.name === "right-door")!;
    const [first, second] = handles(getDefaultCabinetConfig("base")).sort((a, b) => a.position[0] - b.position[0]);
    expect(first!.position[0]).toBeGreaterThan(left.position[0]);
    expect(second!.position[0]).toBeLessThan(right.position[0]);
  });
});
