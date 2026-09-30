import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import { addRoomLightFixture, duplicateRoomLightFixture, isRoomLightFixture, removeRoomLightFixture, updateRoomLightFixture } from "./roomLightFixtures";
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

  it("saves every fixture parameter and ignores an unknown fixture kind", () => {
    const added = addRoomLightFixture(createLivingRoomStarterProject({ now: "2026-10-01T00:00:00.000Z" }), "track");
    const id = added.lights.at(-1)!.id;
    const updated = updateRoomLightFixture(added, id, {
      parameters: { beamAngleDeg: 24, headCount: 4, aimAngleDeg: 12, profileFinish: "black", depthMm: 35 },
    });
    const light = updated.lights.find((item) => item.id === id)!;
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(updated)).document;
    expect(reopened.lights.find((item) => item.id === id)!.parameters).toEqual(light.parameters);
    expect(updateRoomLightFixture(updated, id, { parameters: { headCount: 7 } }).lights).toEqual(updated.lights);
    const rogue = { ...light, id: "rogue-light", parameters: { ...light.parameters, fixtureKind: "lantern" } };
    expect(isRoomLightFixture(rogue)).toBe(false);
    expect(compileLivingRoomScene({ ...reopened, lights: [...reopened.lights, rogue] }).lights.some((item) => item.id === "rogue-light")).toBe(true);
  });

  it("duplicates a fixture in the active room only", () => {
    const project = addRoomLightFixture(createLivingRoomStarterProject({ now: "2026-10-01T00:00:00.000Z" }), "pendant");
    const id = project.lights.at(-1)!.id;
    const copy = duplicateRoomLightFixture(project, id);
    expect(copy.lights).toHaveLength(project.lights.length + 1);
    expect(copy.lights.at(-1)!.parameters.fixtureKind).toBe("pendant");
    expect(copy.lights.at(-1)!.id).not.toBe(id);
    expect(duplicateRoomLightFixture({ ...project, activeRoomId: "another-room" }, id).lights).toEqual(project.lights);
  });

});
