import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { Mesh } from "three";
import { EXCLUDE_FROM_EXPORT, isEditorOnlyObject } from "../../rendering/sceneExport/sceneExportFilter";
import { validParameters } from "./lightParameterLimits";
import {
  beamConeDimensions, bodyFinish, cobShadeParts, gimbalEulerDeg, penumbraForDiffusion, readCobShade, surfaceLiftM, trimFinishColor,
} from "./lightShade";

const light = (parameters: Record<string, string | number | boolean>) => ({ parameters: { fixtureKind: "cob", ...parameters } });

describe("COB shades", () => {
  it("reads defaults, clamps the gimbal tilt, and ignores aim on other shades", () => {
    expect(readCobShade(light({}))).toEqual({ shade: "open", trimFinish: "white", lensDiffusion: 0.5, aimAngleDeg: 0, aimRotationDeg: 0 });
    expect(readCobShade(light({ shade: "gimbal", aimAngleDeg: 80, aimRotationDeg: 400, lensDiffusion: 3 })))
      .toEqual({ shade: "gimbal", trimFinish: "white", lensDiffusion: 1, aimAngleDeg: 45, aimRotationDeg: 40 });
    expect(readCobShade(light({ shade: "baffle", aimAngleDeg: 30 })).aimAngleDeg).toBe(0);
    expect(readCobShade(light({ shade: "lamp", trimFinish: "gold" }))).toMatchObject({ shade: "open", trimFinish: "white" });
  });

  it("validates shade parameters like the other fixture keys", () => {
    expect(validParameters({ shade: "pinhole", trimFinish: "brass", lensDiffusion: 0.2, aimRotationDeg: 90 })).toBe(true);
    expect(validParameters({ shade: "lamp" })).toBe(false);
    expect(validParameters({ trimFinish: "gold" })).toBe(false);
    expect(validParameters({ lensDiffusion: 1.5 })).toBe(false);
    expect(validParameters({ aimRotationDeg: -1 })).toBe(false);
  });

  it("maps diffusion to a penumbra band and finishes to distinct bodies", () => {
    expect(penumbraForDiffusion(0)).toBeCloseTo(0.35);
    expect(penumbraForDiffusion(1)).toBeCloseTo(0.9);
    expect(penumbraForDiffusion(0.5)).toBeCloseTo(0.625);
    const bodies = new Set(["white", "black", "brass", "aluminium"].map((finish) => trimFinishColor(finish as "white").body));
    expect(bodies.size).toBe(4);
  });

  it("builds a distinct body for every shade from the same radius and depth", () => {
    const signatures = new Set();
    for (const shade of ["open", "baffle", "pinhole", "gimbal", "surface"] as const) {
      const parts = cobShadeParts({ shade, trimFinish: "white", lensDiffusion: 0.5, aimAngleDeg: 0, aimRotationDeg: 0 }, 0.045, 0.04, "#ffe9c9");
      expect(parts.filter((part) => part.glow)).toHaveLength(1);
      signatures.add(parts.map((part) => `${part.id}:${part.radiusTop.toFixed(4)}:${part.z.toFixed(4)}`).join("|"));
    }
    expect(signatures.size).toBe(5);
    const surface = cobShadeParts({ shade: "surface", trimFinish: "black", lensDiffusion: 0.5, aimAngleDeg: 0, aimRotationDeg: 0 }, 0.045, 0.04, "#fff");
    expect(surface.every((part) => part.z < 0)).toBe(true);
    const gimbal = cobShadeParts({ shade: "gimbal", trimFinish: "white", lensDiffusion: 0.5, aimAngleDeg: 20, aimRotationDeg: 0 }, 0.045, 0.04, "#fff");
    expect(gimbal.filter((part) => part.tilted).map((part) => part.id)).toEqual(["cup", "glow"]);
  });

  it("gives the Cycles bundle the same gimbal aim the viewport's nested groups produce", () => {
    for (const [aim, spin] of [[20, 0], [30, 90], [45, 210], [10, 345]] as const) {
      const θ = (aim * Math.PI) / 180; const φ = (spin * Math.PI) / 180;
      const nested = new Quaternion().setFromEuler(new Euler(0, 0, φ)).multiply(new Quaternion().setFromEuler(new Euler(θ, 0, 0)));
      const viewport = new Vector3(0, 0, -1).applyQuaternion(nested);
      const [x, y, z] = gimbalEulerDeg(aim, spin).map((deg) => (deg * Math.PI) / 180) as [number, number, number];
      const cycles = new Vector3(0, 0, -1).applyEuler(new Euler(x, y, z, "XYZ"));
      expect(cycles.distanceTo(viewport)).toBeLessThan(1e-6);
    }
  });

  it("caps the beam cone preview inside a room and widens it with the beam angle", () => {
    const narrow = beamConeDimensions((20 * Math.PI) / 360, 5);
    const wide = beamConeDimensions((60 * Math.PI) / 360, 5);
    expect(narrow.lengthM).toBe(2.2);
    expect(wide.radiusM).toBeGreaterThan(narrow.radiusM);
    expect(beamConeDimensions(0.3, 1.2).lengthM).toBe(1.2);
  });

  it("lifts a ceiling-mounted surface cylinder by its drop and gives every fixture one body finish", () => {
    expect(surfaceLiftM({ parameters: { fixtureKind: "cob", shade: "surface", hostSurface: "ceiling", ceilingDropMm: 40 } })).toBeCloseTo(0.04);
    expect(surfaceLiftM({ parameters: { fixtureKind: "cob", shade: "open", hostSurface: "ceiling", ceilingDropMm: 40 } })).toBe(0);
    expect(surfaceLiftM({ parameters: { fixtureKind: "cob", shade: "surface" } })).toBe(0);
    const lifted = cobShadeParts({ ...readCobShade(light({ shade: "surface" })) }, 0.045, 0.04, "#fff", 0.04);
    expect(lifted[0]!.z + lifted[0]!.height / 2).toBeCloseTo(0.04);
    expect(bodyFinish({ enabled: true, parameters: { fixtureKind: "cob", trimFinish: "brass" } }).body).toBe("#b08d57");
    expect(bodyFinish({ enabled: true, parameters: { fixtureKind: "rope", profileFinish: "black" } }).body).toBe("#1c1c1c");
    expect(bodyFinish({ enabled: false, parameters: { fixtureKind: "cob", trimFinish: "brass" } }).body).toBe("#dedbd5");
  });

  it("keeps a beam cone out of exports through the editor-only flag", () => {
    const cone = new Mesh();
    cone.userData = { [EXCLUDE_FROM_EXPORT]: true, beamCone: true };
    expect(isEditorOnlyObject(cone)).toBe(true);
    expect(isEditorOnlyObject(new Mesh())).toBe(false);
  });
});
