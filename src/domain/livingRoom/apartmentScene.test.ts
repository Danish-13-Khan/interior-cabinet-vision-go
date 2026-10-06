import { describe, expect, it } from "vitest";
import { APARTMENT_TEMPLATE_IDS, instantiateApartmentTemplate } from "../apartmentTemplates";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import { roomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import type { InteriorProject } from "../interiorProject";
import { compileApartmentScene } from "./apartmentScene";
import { createRoomSceneCache } from "./roomSceneCache";
import type { CompiledLivingRoomScene, CompiledSceneNode } from "./sceneTypes";

const projects = APARTMENT_TEMPLATE_IDS.map((id) => [
  id,
  instantiateApartmentTemplate(id, { now: COMPOSER_TEST_NOW }),
] as const);

function isCeiling(node: CompiledSceneNode) {
  return node.metadata.surface === "ceiling";
}

function roomScenes(project: InteriorProject) {
  const sceneFor = createRoomSceneCache(project);
  return { sceneFor, scenes: project.rooms.map((room) => sceneFor(room.id)) };
}

function keptCount(scenes: readonly CompiledLivingRoomScene[]) {
  const seen = new Set<string>();
  let ceilings = 0;
  let duplicates = 0;
  let total = 0;
  for (const scene of scenes) {
    for (const node of scene.nodes) {
      total += 1;
      if (isCeiling(node)) ceilings += 1;
      else if (seen.has(node.id)) duplicates += 1;
      else seen.add(node.id);
    }
  }
  return { total, ceilings, duplicates, kept: total - ceilings - duplicates };
}

describe("compileApartmentScene", () => {
  it.each(projects)("%s keeps each shared wall once and drops ceilings", (id, project) => {
    const { sceneFor, scenes } = roomScenes(project);
    const scene = compileApartmentScene(project, sceneFor);
    const ids = scene.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(scene.nodes.some(isCeiling)).toBe(false);
    expect(scene.nodes.length).toBe(keptCount(scenes).kept);
    expect(keptCount(scenes).ceilings).toBe(project.rooms.length);

    const seen = new Set<string>();
    const duplicateRoles = new Set<string>();
    for (const roomScene of scenes) {
      for (const node of roomScene.nodes) {
        if (isCeiling(node)) continue;
        if (seen.has(node.id)) duplicateRoles.add(String(node.metadata.role));
        else seen.add(node.id);
      }
    }
    expect([...duplicateRoles].every((role) => role === "wall" || role === "opening")).toBe(true);

    const wallRooms = new Map<string, number>();
    for (const roomScene of scenes) {
      for (const wallId of new Set(roomScene.nodes.filter((node) => node.metadata.role === "wall").map((node) => node.metadata.wallId))) {
        wallRooms.set(String(wallId), (wallRooms.get(String(wallId)) ?? 0) + 1);
      }
    }
    const shared = [...wallRooms.entries()].filter(([, rooms]) => rooms > 1);
    expect(shared.length, id).toBeGreaterThan(0);
    for (const [wallId, rooms] of shared) {
      const copies = scenes.reduce((count, roomScene) => (
        count + roomScene.nodes.filter((node) => node.metadata.role === "wall" && String(node.metadata.wallId) === wallId).length
      ), 0);
      const kept = scene.nodes.filter((node) => node.metadata.role === "wall" && String(node.metadata.wallId) === wallId).length;
      expect(kept).toBe(copies / rooms);
    }
  });

  it.each(projects)("%s is deterministic and covers every room", (_id, project) => {
    const first = compileApartmentScene(project);
    const second = compileApartmentScene(project);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first.lights).toEqual([]);
    expect(first.cameras).toHaveLength(1);
    expect(first.cameras[0]!.target.x).toBeCloseTo(first.bounds.center.x);
    expect(first.cameras[0]!.target.z).toBeCloseTo(first.bounds.center.z);
    for (const room of project.rooms) {
      const plan = roomPlanViewBounds(project, room.id);
      expect(plan.minX).toBeGreaterThanOrEqual(first.bounds.min.x - 1);
      expect(plan.maxX).toBeLessThanOrEqual(first.bounds.max.x + 1);
      expect(plan.minZ).toBeGreaterThanOrEqual(first.bounds.min.z - 1);
      expect(plan.maxZ).toBeLessThanOrEqual(first.bounds.max.z + 1);
    }
  });
});
