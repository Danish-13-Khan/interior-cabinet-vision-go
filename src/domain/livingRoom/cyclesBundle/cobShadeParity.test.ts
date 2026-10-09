import { describe, expect, it } from "vitest";
import { cobShadeParts, readCobShade } from "../lightShade";
import { createLivingRoomStarterProject } from "../preset";
import { addRoomLightFixture, updateRoomLightFixture } from "../roomLightFixtures";
import { fixtureForCycles } from "./cyclesLights";

const NOW = "2026-10-09T09:00:00.000Z";

function cobFixture(parameters: Record<string, string | number>) {
  const project = createLivingRoomStarterProject({ now: NOW });
  const added = addRoomLightFixture(project, "cob", { kind: "ceiling" });
  const id = added.lights.at(-1)!.id;
  const edited = updateRoomLightFixture(added, id, { parameters });
  const light = edited.lights.find((item) => item.id === id)!;
  return { light, fixture: fixtureForCycles(light) };
}

describe("COB shade parity between viewport and Cycles", () => {
  it("builds the same parts the viewport draws and carries the diffusion into the penumbra", () => {
    const { light, fixture } = cobFixture({ shade: "baffle", trimFinish: "brass", lensDiffusion: 0.2 });
    expect(fixture).toBeTruthy();
    const expected = cobShadeParts(readCobShade(light), 0.045, 0.04, light.color);
    expect(fixture!.parts).toHaveLength(expected.length);
    expect(fixture!.parts.map((part) => part.cyl?.radiusTop)).toEqual(expected.map((part) => part.radiusTop));
    expect(fixture!.parts[0]?.color).toBe("#b08d57");
    expect(fixture!.lights[0]).toMatchObject({ kind: "spot", penumbra: 0.46 });
  });

  it("tilts a gimbal's cup, disc and spot in one frame and leaves the can fixed", () => {
    const { fixture } = cobFixture({ shade: "gimbal", aimAngleDeg: 25, aimRotationDeg: 90 });
    const tilted = fixture!.parts.filter((part) => part.within);
    expect(tilted).toHaveLength(2);
    expect(fixture!.parts.filter((part) => !part.within)).toHaveLength(1);
    expect(fixture!.lights[0]?.within).toEqual(tilted[0]!.within);
  });

  it("hangs a surface cylinder below the ceiling plane", () => {
    const { fixture } = cobFixture({ shade: "surface" });
    expect(fixture!.parts.every((part) => part.local.position.z < 0)).toBe(true);
    expect(fixture!.lights[0]?.local.position.z).toBeLessThan(-0.08);
  });
});
