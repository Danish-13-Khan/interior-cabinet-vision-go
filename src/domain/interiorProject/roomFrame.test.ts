import { describe, expect, it } from "vitest";
import {
  instantiateBathroomCatalogTemplate,
  instantiateBedroomCatalogTemplate,
  instantiateEmptyRoomCatalogTemplate,
  instantiateLKitchenCatalogTemplate,
  instantiateLivingRoomCatalogTemplate,
  instantiateStraightKitchenCatalogTemplate,
} from "../catalog/instantiateNamedCatalogTemplates";
import { createGoldenCabinetRunProject } from "../livingRoom/goldenRun/createProject";
import { resolveLightAttachment } from "../livingRoom/lightAttachments";
import { resolveRecipeLightSeed } from "../livingRoom/lighting";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";
import type { InteriorProject } from "./types";
import { frameIsOrigin, roomFrame } from "./roomFrame";

const NOW = "2026-10-06T00:00:00.000Z";

const singles: Array<[string, InteriorProject]> = [
  ["starter", createLivingRoomStarterProject({ now: NOW })],
  ["catalog living", instantiateLivingRoomCatalogTemplate({ now: NOW })],
  ["catalog empty", instantiateEmptyRoomCatalogTemplate({ now: NOW })],
  ["catalog straight kitchen", instantiateStraightKitchenCatalogTemplate({ now: NOW })],
  ["catalog L kitchen", instantiateLKitchenCatalogTemplate({ now: NOW })],
  ["catalog bedroom", instantiateBedroomCatalogTemplate({ now: NOW })],
  ["catalog bathroom", instantiateBathroomCatalogTemplate({ now: NOW })],
  ["golden run", createGoldenCabinetRunProject(NOW)],
];

describe("single-room projects stay on the origin frame", () => {
  it("treats a centre within 0.5 mm as the origin", () => {
    const span = { widthMm: 1000, depthMm: 1000 };
    expect(frameIsOrigin({ centre: { x: 1e-12, z: 0 }, ...span })).toBe(true);
    expect(frameIsOrigin({ centre: { x: 0.5, z: 0 }, ...span })).toBe(false);
  });

  it.each(singles)("%s lights and frame match the centred scene", (_name, project) => {
    expect(roomFrame(project, project.activeRoomId).centre).toEqual({ x: 0, z: 0 });
    const scene = compileLivingRoomScene(project);
    const expected = project.lights
      .filter((light) => light.roomId === null || light.roomId === project.activeRoomId)
      .map((light) => resolveRecipeLightSeed(resolveLightAttachment(project, light)));
    expect(scene.lights).toEqual(expected);
  });
});
