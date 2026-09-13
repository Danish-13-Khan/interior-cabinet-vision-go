import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  DEFAULT_LIGHT_KELVIN,
  isLightKelvin,
  kelvinToHex,
  nearestKelvinPreset,
  readLightKelvin,
} from "./lightColorTemperature";
import { addRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";

function projectWithFixture() {
  const withLight = addRoomLightFixture(createLivingRoomStarterProject(), "ceiling-downlight");
  const light = withLight.lights[withLight.lights.length - 1];
  return { project: withLight, lightId: light.id };
}

describe("kelvinToHex", () => {
  it("returns warmer tones at low Kelvin than at daylight", () => {
    const warm = kelvinToHex(2200);
    const daylight = kelvinToHex(6500);
    const warmBlue = parseInt(warm.slice(5, 7), 16);
    const daylightBlue = parseInt(daylight.slice(5, 7), 16);
    expect(warmBlue).toBeLessThan(daylightBlue);
    expect(warm).toMatch(/^#[\da-f]{6}$/);
  });

  it("clamps outside the accepted range instead of producing invalid colour", () => {
    expect(kelvinToHex(0)).toBe(kelvinToHex(1800));
    expect(kelvinToHex(99000)).toBe(kelvinToHex(8000));
  });
});

describe("isLightKelvin", () => {
  it("rejects values outside the fixture range and non-numbers", () => {
    expect(isLightKelvin(3000)).toBe(true);
    expect(isLightKelvin(1000)).toBe(false);
    expect(isLightKelvin("3000")).toBe(false);
    expect(isLightKelvin(Number.NaN)).toBe(false);
  });
});

describe("nearestKelvinPreset", () => {
  it("snaps an arbitrary value to the closest labelled preset", () => {
    expect(nearestKelvinPreset(2750).kelvin).toBe(2700);
    expect(nearestKelvinPreset(6000).kelvin).toBe(6500);
  });
});

describe("room light colour temperature", () => {
  it("saves a default Kelvin on a new fixture and derives its colour", () => {
    const { project, lightId } = projectWithFixture();
    const light = project.lights.find((item) => item.id === lightId)!;
    expect(readLightKelvin(light)).toBe(DEFAULT_LIGHT_KELVIN);
    expect(light.color).toBe(kelvinToHex(DEFAULT_LIGHT_KELVIN));
  });

  it("derives colour from a Kelvin change", () => {
    const { project, lightId } = projectWithFixture();
    const next = updateRoomLightFixture(project, lightId, { parameters: { colorTemperatureK: 6500 } });
    const light = next.lights.find((item) => item.id === lightId)!;
    expect(readLightKelvin(light)).toBe(6500);
    expect(light.color).toBe(kelvinToHex(6500));
  });

  it("rejects an out-of-range Kelvin without changing the fixture", () => {
    const { project, lightId } = projectWithFixture();
    const next = updateRoomLightFixture(project, lightId, { parameters: { colorTemperatureK: 50 } });
    expect(next.lights.find((item) => item.id === lightId)).toEqual(
      project.lights.find((item) => item.id === lightId),
    );
  });

  it("drops the saved Kelvin when a colour is picked by hand", () => {
    const { project, lightId } = projectWithFixture();
    const next = updateRoomLightFixture(project, lightId, { color: "#ff00aa" });
    const light = next.lights.find((item) => item.id === lightId)!;
    expect(light.color).toBe("#ff00aa");
    expect(readLightKelvin(light)).toBeNull();
  });
});
