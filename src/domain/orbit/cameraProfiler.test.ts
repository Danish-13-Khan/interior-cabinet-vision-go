import { describe, expect, it } from "vitest";
import { readProfilerSample } from "./cameraProfiler";

describe("cameraProfiler", () => {
  it("reads texture, render, and camera stats", () => {
    expect(
      readProfilerSample(
        {
          memory: { textures: 12, geometries: 4 },
          render: { frame: 80, points: 0, lines: 6 },
          programs: [{}, {}],
        },
        {
          type: "PerspectiveCamera",
          fov: 35,
          near: 0.1,
          far: 500,
          zoom: 1,
          position: { x: 1, y: 2, z: 3 },
        },
      ),
    ).toEqual({
      textures: 12,
      geometries: 4,
      programs: 2,
      renders: 80,
      points: 0,
      lines: 6,
      cameraType: "PerspectiveCamera",
      cameraFov: 35,
      cameraNear: 0.1,
      cameraFar: 500,
      cameraZoom: 1,
      cameraPosition: [1, 2, 3],
    });
  });

  it("returns nulls when renderer info is missing", () => {
    const sample = readProfilerSample(null, null);
    expect(sample.textures).toBeNull();
    expect(sample.renders).toBeNull();
    expect(sample.programs).toBeNull();
    expect(sample.cameraType).toBeNull();
    expect(sample.cameraPosition).toBeNull();
  });
});
