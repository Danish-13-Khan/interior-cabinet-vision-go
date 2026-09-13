import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import { addRoomLightFixture, removeRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";
import { applyLivingRoomLightingRecipe } from "./lighting";
import { compileLivingRoomScene } from "./sceneCompiler";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";

describe("room light fixtures", () => {
  it("saves, reopens, and compiles adjustable strip lights without losing them on recipe changes", () => {
    const original = createLivingRoomStarterProject();
    const added = addRoomLightFixture(original, "under-cabinet");
    const id = added.lights.at(-1)!.id;
    const updated = updateRoomLightFixture(added, id, { parameters: { widthMm: 1800 }, position: { x: 500, y: 1450, z: -1200 }, color: "#ffffff" });
    const switched = applyLivingRoomLightingRecipe(updated, "warm-evening");
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(switched)).document;
    const light = compileLivingRoomScene(reopened).lights.find((item) => item.id === id)!;
    expect(light.parameters.widthMm).toBe(1800);
    expect(light.position).toEqual({ x: 500, y: 1450, z: -1200 });
    expect(light.enabled).toBe(true);
    expect(original.lights.some((item) => item.id === id)).toBe(false);
    expect(removeRoomLightFixture(reopened, id).lights.some((item) => item.id === id)).toBe(false);
  });

  it("protects recipe lights and lights in other rooms", () => {
    const project = addRoomLightFixture(createLivingRoomStarterProject(), "ceiling-downlight");
    const fixture = project.lights.at(-1)!;
    const otherRoom = { ...project, activeRoomId: "another-room" };
    expect(updateRoomLightFixture(otherRoom, fixture.id, { intensity: 90 }).lights).toEqual(project.lights);
    expect(removeRoomLightFixture(otherRoom, fixture.id).lights).toEqual(project.lights);
    expect(removeRoomLightFixture(project, project.lights[0].id).lights).toEqual(project.lights);
  });

  it("rejects invalid numeric edits and changes the scene fingerprint for valid lighting edits", () => {
    const project = addRoomLightFixture(createLivingRoomStarterProject(), "pendant");
    const id = project.lights.at(-1)!.id;
    expect(updateRoomLightFixture(project, id, { intensity: NaN }).lights).toEqual(project.lights);
    expect(updateRoomLightFixture(project, id, { parameters: { widthMm: -20 } }).lights).toEqual(project.lights);
    const next = updateRoomLightFixture(project, id, { enabled: false });
    expect(compileLivingRoomScene(next).fingerprint).not.toBe(compileLivingRoomScene(project).fingerprint);
  });
});
