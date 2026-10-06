import { describe, expect, it } from "vitest";
import type { InteriorProject } from "../interiorProject";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { APARTMENT_SHELL_SPECS, instantiateApartmentTemplate } from "./index";
import { showcaseTourAvailable, showcaseTourRoomOrder, showcaseTourStops } from "./showcaseTour";

const THREE_BHK = "template:apartment:3bhk:v1";
const options = { now: COMPOSER_TEST_NOW };

function keysOf(project: InteriorProject, roomIds: readonly string[]): string[] {
  const keyById = new Map(project.rooms.map((room) => [room.id, String(room.extensions?.apartmentRoomKey)]));
  return roomIds.map((id) => keyById.get(id)!);
}

/** Drop every camera (and bookmark) of one room, as if the user deleted its Showcase view. */
function withoutRoomCameras(project: InteriorProject, roomKey: string): InteriorProject {
  const roomId = project.rooms.find((room) => room.extensions?.apartmentRoomKey === roomKey)!.id;
  const cameras = project.cameras.filter((camera) => camera.roomId !== roomId);
  const kept = new Set(cameras.map((camera) => camera.id));
  return {
    ...project,
    cameras,
    renderSettings: {
      ...project.renderSettings,
      packageCameraBookmarks: (project.renderSettings.packageCameraBookmarks ?? [])
        .filter((bookmark) => kept.has(bookmark.cameraId)),
    },
  };
}

describe("Showcase tour stops", () => {
  it("3 BHK follows the spec room order starting from the main (hero) room", () => {
    const project = instantiateApartmentTemplate(THREE_BHK, options);
    const stops = showcaseTourStops(project);
    expect(keysOf(project, stops.map((stop) => stop.roomId))).toEqual([
      "living", "kitchen", "utility", "study", "balcony", "passage", "guest", "kids",
      "master", "guest-bath", "common-bath", "master-bath", "walk-in", "foyer",
    ]);
    expect(stops).toHaveLength(project.rooms.length);
    for (const stop of stops) {
      const camera = project.cameras.find((item) => item.id === stop.cameraId)!;
      expect(camera.roomId).toBe(stop.roomId);
      expect(camera.name).toContain("Showcase");
      expect(stop.roomName).toBe(project.rooms.find((room) => room.id === stop.roomId)!.name);
    }
    expect(showcaseTourAvailable(stops)).toBe(true);
  });

  it("every apartment template starts at its hero room and rotates the spec order", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = instantiateApartmentTemplate(spec.id, options);
      const keys = keysOf(project, showcaseTourStops(project).map((stop) => stop.roomId));
      const specKeys = spec.rooms.map((room) => room.key);
      const hero = specKeys.indexOf(spec.heroRoomKey);
      const expected = [...specKeys.slice(hero), ...specKeys.slice(0, hero)];
      expect(keys, spec.id).toEqual(expected.filter((key) => keys.includes(key)));
      expect(keys[0], spec.id).toBe(spec.heroRoomKey);
    }
  });

  it("skips rooms without a camera instead of holding the previous room's camera", () => {
    const base = instantiateApartmentTemplate(THREE_BHK, options);
    const project = withoutRoomCameras(withoutRoomCameras(base, "kitchen"), "walk-in");
    const stops = showcaseTourStops(project);
    const keys = keysOf(project, stops.map((stop) => stop.roomId));
    expect(keys).not.toContain("kitchen");
    expect(keys).not.toContain("walk-in");
    expect(keys.slice(0, 3)).toEqual(["living", "utility", "study"]);
    expect(stops).toHaveLength(base.rooms.length - 2);
    // Each stop's camera lives in that stop's room — never a neighbour's camera.
    for (const stop of stops) {
      expect(project.cameras.find((camera) => camera.id === stop.cameraId)?.roomId).toBe(stop.roomId);
    }
    // The room order itself still lists them; only the stops skip them.
    expect(keysOf(project, showcaseTourRoomOrder(project))).toContain("kitchen");
  });

  it("falls back to an unbookmarked room camera, and hides the tour below two stops", () => {
    const base = instantiateApartmentTemplate(THREE_BHK, options);
    const unbookmarked = {
      ...base,
      renderSettings: { ...base.renderSettings, packageCameraBookmarks: [] },
    };
    expect(showcaseTourStops(unbookmarked)).toHaveLength(base.rooms.length);
    const living = base.rooms.find((room) => room.extensions?.apartmentRoomKey === "living")!;
    const single = { ...base, cameras: base.cameras.filter((camera) => camera.roomId === living.id) };
    expect(showcaseTourStops(single)).toHaveLength(1);
    expect(showcaseTourAvailable(showcaseTourStops(single))).toBe(false);
  });

  it("projects that are not apartments tour in project order from the active room", () => {
    const base = instantiateApartmentTemplate(THREE_BHK, options);
    const extensions = { ...base.extensions };
    delete extensions.apartmentTemplateId;
    const second = base.rooms[1]!.id;
    const project = { ...base, extensions, activeRoomId: second };
    const order = showcaseTourRoomOrder(project);
    expect(order[0]).toBe(second);
    expect(order).toEqual([...base.rooms.slice(1), base.rooms[0]!].map((room) => room.id));
  });
});
