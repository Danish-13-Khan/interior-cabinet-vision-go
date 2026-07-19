import { describe, expect, it } from "vitest";
import {
  clampCabinetPlacement,
  getDefaultCabinetConfig,
  getFootprintDimensions,
  getWallPlacement,
  ROOM_DEPTH_MM,
  ROOM_WIDTH_MM,
} from "./cabinetDimensions";

describe("cabinet placement helpers", () => {
  it("swaps footprint dimensions at 90 degrees", () => {
    const dimensions = getDefaultCabinetConfig("base").dimensions;
    const footprint = getFootprintDimensions(dimensions, 90);

    expect(footprint.width).toBe(dimensions.depth);
    expect(footprint.depth).toBe(dimensions.width);
  });

  it("clamps floor placement inside the room bounds", () => {
    const dimensions = getDefaultCabinetConfig("base").dimensions;
    const placement = clampCabinetPlacement(
      {
        x: ROOM_WIDTH_MM,
        y: 0,
        z: ROOM_DEPTH_MM,
        rotation: 0,
        attachment: "floor",
      },
      dimensions,
    );

    expect(placement.x).toBeLessThanOrEqual(ROOM_WIDTH_MM / 2);
    expect(placement.z).toBeLessThanOrEqual(ROOM_DEPTH_MM / 2);
    expect(placement.y).toBe(0);
  });

  it("snaps wall placement to the back wall", () => {
    const config = getDefaultCabinetConfig("wall");
    const placement = getWallPlacement(
      {
        x: 200,
        y: 1400,
        z: 300,
        rotation: 180,
        attachment: "floor",
      },
      config.type,
      config.dimensions,
      "back-wall",
    );

    expect(placement.attachment).toBe("back-wall");
    expect(placement.rotation).toBe(0);
    expect(placement.z).toBeLessThan(0);
  });
});
