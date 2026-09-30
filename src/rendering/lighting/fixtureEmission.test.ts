import { describe, expect, it } from "vitest";
import { Euler, Quaternion, Vector3 } from "three";
import { LIGHT_RENDER_SCALE } from "../../domain/livingRoom/lightFixtureTypes";
import { LIGHT_PARAMETER_LIMITS } from "../../domain/livingRoom/lightParameterLimits";
import { roomLightRotation } from "./RoomLightFixture";
import {
  COVE_WALL_LIGHT_ROTATION,
  beamHalfAngleRad,
  clampedHeadCount,
  coveWallIntensity,
} from "./fixtures/fixtureMeasures";
import { headAimRad } from "./fixtures/TrackFixture";
import { getLightFixtureDefinition } from "../../domain/livingRoom/lightFixtureRegistry";

function apply(rotation: [number, number, number, "YXZ"], local: Vector3) {
  return local.applyEuler(new Euler(rotation[0], rotation[1], rotation[2], rotation[3]));
}

/** Parent YXZ, then a child XYZ rotation, applied to a local −Z emitter. */
function childAim(parent: { x: number; y: number; z: number }, child: [number, number, number]) {
  const group = new Euler(...roomLightRotation(parent));
  const local = new Euler(child[0], child[1], child[2], "XYZ");
  const quaternion = new Quaternion().setFromEuler(group).multiply(new Quaternion().setFromEuler(local));
  return new Vector3(0, 0, -1).applyQuaternion(quaternion);
}

describe("fixture emission frame", () => {
  it("keeps the head cap at 6 and halves the beam into radians", () => {
    expect(LIGHT_PARAMETER_LIMITS.headCount.max).toBe(6);
    expect(clampedHeadCount({ parameters: { headCount: 9 } })).toBe(6);
    expect(clampedHeadCount({ parameters: { headCount: 0 } })).toBe(1);
    expect(clampedHeadCount({ parameters: {} })).toBe(3);
    expect(beamHalfAngleRad({ parameters: { beamAngleDeg: 40 } })).toBeCloseTo((20 * Math.PI) / 180);
  });

  it("alternates track head tilt so the pools straddle the rail", () => {
    const aim = 20 * Math.PI / 180;
    expect([0, 1, 2, 3].map((index) => headAimRad(aim, index))).toEqual([aim, -aim, aim, -aim]);
    expect(headAimRad(0, 1)).toBe(-0);
  });

  it("seeds the panel brighter than a point-like emitter, since it is the ceiling's main source", () => {
    expect(getLightFixtureDefinition("panel").defaults.intensity).toBe(12);
    expect(getLightFixtureDefinition("cob").defaults.intensity).toBeLessThan(12);
  });

  it("scales the cove wall band by coveWallShare and no other factor", () => {
    expect(coveWallIntensity(20)).toBe(20 * LIGHT_RENDER_SCALE.coveWallShare);
    expect(coveWallIntensity(0)).toBe(0);
  });

  it("aims an unrotated body along −Z, up for a cove and down for a ceiling mount", () => {
    const up = apply(roomLightRotation({ x: 90, y: 90, z: 0 }), new Vector3(0, 0, -1));
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeCloseTo(1);
    expect(up.z).toBeCloseTo(0);
    const down = apply(roomLightRotation({ x: -90, y: 45, z: 0 }), new Vector3(0, 0, -1));
    expect(down.y).toBeCloseTo(-1);
    expect(down.x).toBeCloseTo(0);
    expect(down.z).toBeCloseTo(0);
  });

  it("aims the cove wall light at the wall for a straight wall and a side wall", () => {
    for (const yaw of [0, 90, -35]) {
      const away = apply(roomLightRotation({ x: 0, y: yaw, z: 0 }), new Vector3(0, 0, -1));
      const toward = childAim({ x: 90, y: yaw, z: 0 }, COVE_WALL_LIGHT_ROTATION);
      expect(toward.y).toBeCloseTo(0);
      expect(toward.dot(away)).toBeCloseTo(-1);
      expect(toward.length()).toBeCloseTo(1);
    }
  });
});
