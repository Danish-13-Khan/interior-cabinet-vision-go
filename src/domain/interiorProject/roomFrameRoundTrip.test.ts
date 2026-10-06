import { describe, expect, it } from "vitest";
import { APARTMENT_TEMPLATE_IDS, composeApartment, lookupApartmentTemplate } from "../apartmentTemplates";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import {
  instantiateBathroomCatalogTemplate,
  instantiateBedroomCatalogTemplate,
  instantiateEmptyRoomCatalogTemplate,
  instantiateLKitchenCatalogTemplate,
  instantiateLivingRoomCatalogTemplate,
  instantiateStraightKitchenCatalogTemplate,
} from "../catalog/instantiateNamedCatalogTemplates";
import { createGoldenCabinetRunProject } from "../livingRoom/goldenRun/createProject";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "./cabinetAdapter";
import type { InteriorProject } from "./types";

const NOW = "2026-10-06T00:00:00.000Z";

const projects: Array<[string, InteriorProject]> = [
  ...APARTMENT_TEMPLATE_IDS.map((id) => [
    id,
    composeApartment(lookupApartmentTemplate(id)!, { now: COMPOSER_TEST_NOW }),
  ] as [string, InteriorProject]),
  ["starter", createLivingRoomStarterProject({ now: NOW })],
  ["catalog living", instantiateLivingRoomCatalogTemplate({ now: NOW })],
  ["catalog empty", instantiateEmptyRoomCatalogTemplate({ now: NOW })],
  ["catalog straight kitchen", instantiateStraightKitchenCatalogTemplate({ now: NOW })],
  ["catalog L kitchen", instantiateLKitchenCatalogTemplate({ now: NOW })],
  ["catalog bedroom", instantiateBedroomCatalogTemplate({ now: NOW })],
  ["catalog bathroom", instantiateBathroomCatalogTemplate({ now: NOW })],
  ["golden run", createGoldenCabinetRunProject(NOW)],
];

function cabinetPose(project: InteriorProject) {
  return project.objects
    .filter((object) => object.kind === "cabinet")
    .map((object) => ({
      id: object.id,
      roomId: object.roomId,
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      rotationY: object.rotation.y,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function writeBack(project: InteriorProject, activeRoomId: string) {
  const source = { ...project, activeRoomId };
  const adapted = cabinetProjectFromInteriorProject(source);
  const written = interiorProjectFromCabinetProject({
    project: adapted.project,
    activeRoom: adapted.room,
    now: project.updatedAt,
  });
  return { source, adapted, written };
}

describe("cabinet positions survive a classic-model round trip", () => {
  it.each(projects)("%s keeps every room", (_name, project) => {
    const rooms = project.rooms.length > 0 ? project.rooms : [{ id: project.activeRoomId }];
    expect(rooms.length).toBeGreaterThan(0);
    for (const room of rooms) {
      const { source, written } = writeBack(project, room.id);
      expect(cabinetPose(written)).toEqual(cabinetPose(source));
    }
  });

  it.each(projects)("%s survives a copied project (history, reload)", (_name, project) => {
    const adapted = cabinetProjectFromInteriorProject(project);
    const written = interiorProjectFromCabinetProject({
      project: structuredClone(adapted.project),
      activeRoom: adapted.room,
      now: project.updatedAt,
    });
    expect(cabinetPose(written)).toEqual(cabinetPose(project));
  });

  // Engineering edits are immutable: a new project object with one changed cabinet.
  it.each([
    [APARTMENT_TEMPLATE_IDS[2]!, "kitchen"],
    ["catalog L kitchen", null],
  ] as const)("%s moves only the cabinet Engineering edited", (name, roomKey) => {
    const base = projects.find(([entry]) => entry === name)![1];
    const roomId = roomKey
      ? base.rooms.find((room) => room.extensions?.apartmentRoomKey === roomKey)!.id
      : base.activeRoomId;
    const project = { ...base, activeRoomId: roomId };
    const adapted = cabinetProjectFromInteriorProject(project);
    const target = adapted.project.cabinets[0]!;
    const edited = {
      ...adapted.project,
      cabinets: adapted.project.cabinets.map((cabinet) => (cabinet === target
        ? { ...cabinet, placement: { ...cabinet.placement, x: cabinet.placement.x + 100 } }
        : cabinet)),
    };
    const written = interiorProjectFromCabinetProject({
      project: edited,
      activeRoom: adapted.room,
      now: project.updatedAt,
    });
    const id = target.interiorObjectId || target.id;
    const before = cabinetPose(project).find((item) => item.id === id)!;
    const after = cabinetPose(written).find((item) => item.id === id)!;
    expect(after).toEqual({ ...before, x: before.x + 100 });
    expect(cabinetPose(written).filter((item) => item.id !== id)).toEqual(
      cabinetPose(project).filter((item) => item.id !== id),
    );
  });
});
