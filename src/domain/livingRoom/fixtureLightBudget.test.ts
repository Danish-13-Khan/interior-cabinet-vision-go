import { describe, expect, it } from "vitest";
import type { LightEntity } from "../interiorProject";
import { resolveModelViewMaxGlbCasters } from "./modelViewPerf";
import { resolveModelViewLightingQuality } from "./modelViewPreviewDefaults";
import { fixtureRenderIntensity } from "./lightFixtureTypes";
import { createLivingRoomStarterProject } from "./preset";
import { addRoomLightFixture, removeRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";
import {
  fixtureShaderCounts,
  lightCountRecompileHitch,
  modelViewFixturesCastShadows,
  projectLightIsMounted,
  shaderProgramCacheKey,
  shaderSourceTotal,
  sumShaderCounts,
  withinModelViewLightBudget,
} from "./fixtureLightBudget";

const NOW = "2026-10-01T00:00:00.000Z";

function starter() {
  return createLivingRoomStarterProject({ now: NOW });
}

function fake(kind: string, parameters: LightEntity["parameters"] = {}, enabled = true): LightEntity {
  const base = kind === "pendant" ? "point" : kind === "track" || kind === "cob" ? "spot" : "area";
  return {
    id: kind, roomId: "room", name: kind, kind: base, enabled, color: "#ffffff", intensity: 10,
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    parameters: { fixtureKind: kind, ...parameters },
  };
}

describe("fixture light budget", () => {
  it("counts the wall halo of a wall-mounted rope or profile, and not of a free one", () => {
    expect(sumShaderCounts([fake("rope", { hostWallId: "w" })]).numRectAreaLights).toBe(2);
    expect(sumShaderCounts([fake("profile", { hostWallId: "w" })]).numRectAreaLights).toBe(2);
    expect(sumShaderCounts([fake("rope"), fake("under-cabinet", { hostWallId: "w" })]).numRectAreaLights).toBe(2);
  });

  it("counts cove wall share and track heads as sources, and stays inside 12", () => {
    const lights = [
      fake("cove"), fake("cove"),
      fake("track", { headCount: 6 }),
      fake("panel"), fake("pendant"),
    ];
    const counts = sumShaderCounts(lights);
    expect(counts).toEqual({ numRectAreaLights: 5, numSpotLights: 6, numPointLights: 1 });
    expect(shaderSourceTotal(counts)).toBe(12);
    expect(withinModelViewLightBudget(shaderSourceTotal(counts))).toBe(true);
    expect(withinModelViewLightBudget(13)).toBe(false);
  });

  it("keeps Model View shadow caps and never lets fixtures cast in draft", () => {
    expect(resolveModelViewMaxGlbCasters("standard")).toBe(10);
    expect(resolveModelViewLightingQuality("standard").maxDirectionalCasters).toBe(2);
    expect(modelViewFixturesCastShadows("draft")).toBe(false);
    expect(modelViewFixturesCastShadows("standard")).toBe(false);
  });

  it("recompiles on add and remove, not on toggle, brightness, colour, or position", () => {
    const source = starter();
    const added = addRoomLightFixture(source, "track", { kind: "ceiling" });
    const track = added.lights.at(-1)!;
    const before = sumShaderCounts(source.lights);
    const mounted = sumShaderCounts(added.lights);
    expect(lightCountRecompileHitch(before, mounted)).toBe(3);
    expect(shaderProgramCacheKey(mounted)).not.toBe(shaderProgramCacheKey(before));

    const off = updateRoomLightFixture(added, track.id, { enabled: false });
    const disabled = off.lights.find((light) => light.id === track.id)!;
    expect(projectLightIsMounted(disabled)).toBe(true);
    expect(fixtureRenderIntensity(disabled, disabled.kind, 1)).toBe(0);
    expect(lightCountRecompileHitch(mounted, sumShaderCounts(off.lights))).toBe(0);

    const brighter = updateRoomLightFixture(added, track.id, { intensity: 80, color: "#ff8800" });
    expect(shaderProgramCacheKey(sumShaderCounts(brighter.lights))).toBe(shaderProgramCacheKey(mounted));
    const moved = updateRoomLightFixture(added, track.id, { position: { x: 100, y: 200, z: 300 } });
    expect(shaderProgramCacheKey(sumShaderCounts(moved.lights))).toBe(shaderProgramCacheKey(mounted));

    const removed = removeRoomLightFixture(added, track.id);
    expect(lightCountRecompileHitch(mounted, sumShaderCounts(removed.lights))).toBe(3);
  });

  it("drops a disabled non-fixture from the program cache", () => {
    const light = fake("lantern");
    light.parameters = { fixtureKind: "lantern" };
    light.kind = "spot";
    expect(fixtureShaderCounts(light).numSpotLights).toBe(1);
    expect(fixtureShaderCounts({ ...light, enabled: false })).toEqual({
      numRectAreaLights: 0, numSpotLights: 0, numPointLights: 0,
    });
  });
});
