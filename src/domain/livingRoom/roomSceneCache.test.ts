import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import { instantiateApartmentTemplate } from "../apartmentTemplates/instantiateApartmentTemplate";
import { createRoomSceneCache } from "./roomSceneCache";
import { compileLivingRoomScene } from "./sceneCompiler";

const project = instantiateApartmentTemplate("template:apartment:2bhk:v1", { now: COMPOSER_TEST_NOW });
const otherRoom = project.rooms.find((room) => room.id !== project.activeRoomId)!;

describe("createRoomSceneCache", () => {
  it("compiles the active room exactly as Model View always has", () => {
    const sceneFor = createRoomSceneCache(project);
    expect(sceneFor(null).fingerprint).toBe(compileLivingRoomScene(project).fingerprint);
    expect(sceneFor(project.activeRoomId)).toBe(sceneFor(null));
  });

  it("compiles another room as a view of the same project and reuses it on revisits", () => {
    const sceneFor = createRoomSceneCache(project);
    const scene = sceneFor(otherRoom.id);
    expect(scene.roomId).toBe(otherRoom.id);
    expect(scene.fingerprint).not.toBe(sceneFor(null).fingerprint);
    expect(sceneFor(otherRoom.id)).toBe(scene);
    expect(project.activeRoomId).not.toBe(otherRoom.id);
  });
});
