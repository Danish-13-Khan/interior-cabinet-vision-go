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
    expect(fixture!.lights[0]?.kind).toBe("spot");
    expect(fixture!.lights[0]?.penumbra).toBeCloseTo(0.46, 6);
  });

  it("tilts a gimbal's cup, disc and spot in one frame and leaves the can fixed", () => {
    const { fixture } = cobFixture({ shade: "gimbal", aimAngleDeg: 25, aimRotationDeg: 90 });
    const tilted = fixture!.parts.filter((part) => part.within);
    expect(tilted).toHaveLength(2);
    expect(fixture!.parts.filter((part) => !part.within)).toHaveLength(1);
    expect(fixture!.lights[0]?.within).toEqual(tilted[0]!.within);
  });

  it("sits a surface cylinder on the ceiling: lifted by the mount's drop so its top touches the slab", () => {
    const { light, fixture } = cobFixture({ shade: "surface" });
    const dropM = Number(light.parameters.ceilingDropMm) / 1000;
    expect(dropM).toBeGreaterThan(0);
    const body = fixture!.parts[0]!;
    expect(body.local.position.z + body.cyl!.height / 2).toBeCloseTo(dropM, 6);
    expect(fixture!.lights[0]?.local.position.z).toBeLessThan(dropM - 0.08);
  });
});
