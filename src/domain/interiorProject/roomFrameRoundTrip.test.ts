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

  it("moves only the cabinet Engineering edited", () => {
    const project = projects.find(([name]) => name === APARTMENT_TEMPLATE_IDS[0])![1];
    const adapted = cabinetProjectFromInteriorProject(project);
    const cabinet = adapted.project.cabinets[0]!;
    cabinet.placement = { ...cabinet.placement, x: cabinet.placement.x + 100 };
    const written = interiorProjectFromCabinetProject({
      project: adapted.project,
      activeRoom: adapted.room,
      now: project.updatedAt,
    });
    const id = cabinet.interiorObjectId || cabinet.id;
    const before = cabinetPose(project).find((item) => item.id === id)!;
    const after = cabinetPose(written).find((item) => item.id === id)!;
    expect(after).toEqual({ ...before, x: before.x + 100 });
    expect(cabinetPose(written).filter((item) => item.id !== id)).toEqual(
      cabinetPose(project).filter((item) => item.id !== id),
    );
  });
});
