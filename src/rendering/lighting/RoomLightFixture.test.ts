import { describe, expect, it } from "vitest";
import { roomLightRotation } from "./RoomLightFixture";

describe("room light rotation", () => {
  it("uses Euler order YXZ so a yawed cove still tilts about its own axis", () => {
    const rotation = roomLightRotation({ x: 90, y: 90, z: 0 });
    expect(rotation[3]).toBe("YXZ");
    expect(rotation[0]).toBeCloseTo(Math.PI / 2);
    expect(rotation[1]).toBeCloseTo(Math.PI / 2);
    expect(rotation[2]).toBe(0);
  });
});
