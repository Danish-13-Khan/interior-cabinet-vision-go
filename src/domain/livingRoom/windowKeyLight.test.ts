import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import { applyLivingRoomStyle } from "./stylePresets";
import {
  resolveWindowKeyLights,
  sampleWindowOpenings,
} from "./windowKeyLight";
import { createPhase1BenchmarkProject } from "./phase1Benchmarks";

const NOW = "2026-08-12T20:00:00.000Z";

describe("windowKeyLight", () => {
  it("samples windows with inward normals toward room center", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms[0]!;
    const center = { x: 0, y: room.dimensions.heightMm / 2, z: 0 };
    const samples = sampleWindowOpenings({
      walls: project.walls,
      openings: project.openings,
      roomCenterMm: center,
    });
    expect(samples.length).toBeGreaterThan(0);
    const windowSample = samples[0]!;
    expect(windowSample.centerMm.y).toBeGreaterThan(700);
    const toCenter = {
      x: center.x - windowSample.centerMm.x,
      z: center.z - windowSample.centerMm.z,
    };
    expect(
      windowSample.inwardNormal.x * toCenter.x + windowSample.inwardNormal.z * toCenter.z,
    ).toBeGreaterThan(0);
  });

  it("makes Client Preview key stronger and shadowed vs Draft preview", () => {
    const project = applyLivingRoomStyle(
      createLivingRoomStarterProject({ now: NOW, lightingRecipeId: "daylight" }),
      "nordic-light",
    );
    const room = project.rooms[0]!;
    const center = { x: 0, y: room.dimensions.heightMm / 2, z: 0 };
    const openings = sampleWindowOpenings({
      walls: project.walls,
      openings: project.openings,
      roomCenterMm: center,
    });
    const draft = resolveWindowKeyLights({
      openings,
      roomCenterMm: center,
      recipeId: "daylight",
      mode: "preview",
      quality: "draft",
    });
    const client = resolveWindowKeyLights({
      openings,
      roomCenterMm: center,
      recipeId: "daylight",
      mode: "hero",
      quality: "client-preview",
    });
    expect(draft[0]?.castShadow).toBe(false);
    expect(client[0]?.castShadow).toBe(true);
    expect(client[0]!.intensity).toBeGreaterThan(draft[0]!.intensity);
    expect(client[0]!.positionMm.x).not.toBe(client[0]!.targetMm.x);
  });

  it("returns no lights when the room has no windows", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const room = project.rooms[0]!;
    const center = { x: 0, y: room.dimensions.heightMm / 2, z: 0 };
    const lights = resolveWindowKeyLights({
      openings: [],
      roomCenterMm: center,
      recipeId: "daylight",
      mode: "hero",
      quality: "client-preview",
    });
    expect(lights).toEqual([]);
  });

  it("still emits a softer key for warm-evening on Phase 1 daylight bench", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const room = project.rooms[0]!;
    const center = { x: 0, y: room.dimensions.heightMm / 2, z: 0 };
    const openings = sampleWindowOpenings({
      walls: project.walls,
      openings: project.openings,
      roomCenterMm: center,
    });
    const evening = resolveWindowKeyLights({
      openings,
      roomCenterMm: center,
      recipeId: "warm-evening",
      mode: "hero",
      quality: "client-preview",
    });
    const daylight = resolveWindowKeyLights({
      openings,
      roomCenterMm: center,
      recipeId: "daylight",
      mode: "hero",
      quality: "client-preview",
    });
    expect(evening.length).toBe(1);
    expect(evening[0]!.intensity).toBeLessThan(daylight[0]!.intensity);
  });
});
