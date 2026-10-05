import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "../cabinetDimensions";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import {
  applyFrontSystemParameters,
  clampGolaProfileSize,
  defaultGolaProfiles,
  frontSystemFromParameters,
  golaParameterKey,
  golaProfilesForType,
  normalizeFrontSystem,
} from ".";

describe("gola profile sizes", () => {
  it("defaults sit inside the standard ranges from the factory table", () => {
    expect(defaultGolaProfiles()).toEqual({
      L: { heightMm: 60, depthMm: 27 },
      C: { heightMm: 74, depthMm: 27 },
      wall: { heightMm: 23, depthMm: 23 },
    });
  });

  it("clamps configured sizes to the standard range, keeping one decimal", () => {
    expect(clampGolaProfileSize("L", { heightMm: 56.54, depthMm: 30 })).toEqual({ heightMm: 56.5, depthMm: 27.5 });
    expect(clampGolaProfileSize("C", { heightMm: 10, depthMm: 26 })).toEqual({ heightMm: 73, depthMm: 26 });
    expect(clampGolaProfileSize("wall", { heightMm: 99 })).toEqual({ heightMm: 27.2, depthMm: 23 });
  });

  it("anything that is not gola normalises to handles", () => {
    expect(normalizeFrontSystem(undefined)).toEqual({ kind: "handled" });
    expect(normalizeFrontSystem({ kind: "magnet" })).toEqual({ kind: "handled" });
    expect(normalizeFrontSystem({ kind: "gola" })).toEqual({ kind: "gola", profiles: defaultGolaProfiles() });
  });

  it("picks profiles by cabinet type", () => {
    expect(golaProfilesForType("base")).toEqual(["L", "C"]);
    expect(golaProfilesForType("tall")).toEqual(["C"]);
    expect(golaProfilesForType("wall")).toEqual(["wall"]);
  });
});

describe("front system object parameters", () => {
  it("reads sizes from Interiors object parameters", () => {
    const system = frontSystemFromParameters({
      frontSystem: "gola",
      [golaParameterKey("L", "heightMm")]: 68,
      [golaParameterKey("wall", "depthMm")]: 19,
    });
    expect(golaParameterKey("wall", "depthMm")).toBe("golaWallDepthMm");
    expect(system).toEqual({
      kind: "gola",
      profiles: { ...defaultGolaProfiles(), L: { heightMm: 68, depthMm: 27 }, wall: { heightMm: 23, depthMm: 19 } },
    });
    expect(frontSystemFromParameters({})).toBeNull();
  });

  it("writes gola onto the cabinet spec and drops it again for handles", () => {
    const config = getDefaultCabinetConfig("base");
    const gola = applyFrontSystemParameters(config, { frontSystem: "gola" });
    expect(normalizeConstructionSpec("base", gola.construction).frontSystem?.kind).toBe("gola");
    const handled = applyFrontSystemParameters(gola, { frontSystem: "handled" });
    expect(normalizeConstructionSpec("base", handled.construction).frontSystem).toBeUndefined();
    expect(applyFrontSystemParameters(config, {})).toBe(config);
  });
});
