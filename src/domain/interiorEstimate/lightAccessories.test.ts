import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { addRoomLightFixture } from "../livingRoom/roomLightFixtures";
import { lightAccessoryLines } from "./lightAccessories";
import { measureInteriorEstimate } from "./measure";
import { writeInteriorEstimate, readInteriorEstimate } from "./state";
import { millworkShortcutsForRoom } from "../livingRoom/millworkShortcuts";

describe("lightAccessoryLines", () => {
  it("adds one driver per 5 m plus profile and diffuser for the strip length", () => {
    const project = addRoomLightFixture(createLivingRoomStarterProject(), "under-cabinet");
    const light = project.lights.find((item) => item.parameters.fixtureKind === "under-cabinet")!;
    const accessories = lightAccessoryLines({
      ...light,
      parameters: { ...light.parameters, widthMm: 12000 },
    });
    expect(accessories.find((row) => row.category === "light.driver")?.measured).toBe(3);
    expect(accessories.find((row) => row.category === "light.profile")?.measured).toBe(12);
    expect(accessories.find((row) => row.category === "light.diffuser")?.measured).toBe(12);
  });

  it("emits accessory lines on the interior estimate for every strip", () => {
    const project = writeInteriorEstimate(
      addRoomLightFixture(createLivingRoomStarterProject(), "cove"),
      { ...readInteriorEstimate(createLivingRoomStarterProject()), enabled: true },
    );
    const lines = measureInteriorEstimate(project, { "light.driver": 400, "light.profile": 180 });
    expect(lines.some((line) => line.category === "light.driver" && line.rate === 400)).toBe(true);
    expect(lines.some((line) => line.category === "light.profile" && line.rate === 180)).toBe(true);
    expect(lines.some((line) => line.category === "light.diffuser" && line.rateSource === "missing")).toBe(true);
  });
});

describe("millworkShortcutsForRoom", () => {
  it("offers wardrobes in the bedroom view and kitchen millwork in the kitchen view", () => {
    expect(millworkShortcutsForRoom("bedroom").some((item) => item.id === "living:wardrobe-wall")).toBe(true);
    expect(millworkShortcutsForRoom("kitchen").some((item) => item.id === "living:base-cabinet-900")).toBe(true);
    expect(millworkShortcutsForRoom("bathroom")).toEqual([]);
  });
});
