import { describe, expect, it } from "vitest";
import { cameraInsideRoomMeters } from "./modelViewRoomFog";
import type { CompiledSceneBounds } from "./sceneTypes";

const room: CompiledSceneBounds = {
  min: { x: 0, y: 0, z: 0 },
  max: { x: 5000, y: 2800, z: 4000 },
  center: { x: 2500, y: 1400, z: 2000 },
  size: { widthMm: 5000, heightMm: 2800, depthMm: 4000 },
};

describe("room fog", () => {
  it("turns fog off inside the room and leaves it on outside", () => {
    expect(cameraInsideRoomMeters({ x: 2.5, y: 1.4, z: 2 }, room)).toBe(true);
    expect(cameraInsideRoomMeters({ x: 12, y: 8, z: 12 }, room)).toBe(false);
  });
});
