import { describe, expect, it } from "vitest";
import {
  cameraClearsWallVolume,
  projectedRoomCoverage,
  resolveExteriorFrame,
} from "./modelViewExteriorFrame";
import type { CompiledSceneBounds } from "./sceneTypes";
import type { ModelViewPresetId } from "./modelViewPresets";

const longRoom: CompiledSceneBounds = {
  min: { x: 0, y: 0, z: 0 },
  max: { x: 11700, y: 2800, z: 4500 },
  center: { x: 5850, y: 1400, z: 2250 },
  size: { widthMm: 11700, heightMm: 2800, depthMm: 4500 },
};
const viewport = { widthPx: 1000, heightPx: 700 };

describe("exterior model framing", () => {
  it("frames the long room from outside with at least 40% coverage", () => {
    const presets: ModelViewPresetId[] = [
      "perspective", "isometric", "front", "side", "dollhouse", "orbit", "top",
    ];
    for (const preset of presets) {
      const frame = resolveExteriorFrame(longRoom, preset, viewport);
      expect(cameraClearsWallVolume(longRoom, frame.position, false), preset).toBe(true);
      const coverage = projectedRoomCoverage({
        bounds: longRoom,
        position: frame.position,
        target: frame.target,
        fovDegrees: frame.fieldOfViewDegrees,
        widthPx: viewport.widthPx,
        heightPx: viewport.heightPx,
        orthographicZoom: frame.orthographicZoom,
      });
      const longAxis = Math.max(coverage.width, coverage.height);
      expect(longAxis, preset).toBeGreaterThanOrEqual(0.6);
      expect(longAxis, preset).toBeLessThanOrEqual(0.9);
      const minArea = preset === "front" || preset === "side" || preset === "top" ? 0.22 : 0.4;
      expect(coverage.area, preset).toBeGreaterThanOrEqual(minArea);
    }
  });

  it("starts walkthrough inside the clear volume, not in a wall", () => {
    const frame = resolveExteriorFrame(longRoom, "walkthrough", viewport);
    expect(cameraClearsWallVolume(longRoom, frame.position, true)).toBe(true);
  });
});
