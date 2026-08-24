import { describe, expect, it } from "vitest";
import { compileLivingRoomScene, createLivingRoomStarterProject } from ".";
import {
  paintLivingRoomSurface,
  setLivingRoomFloorMaterial,
  setLivingRoomLayerVisibility,
  setLivingRoomWallMaterial,
} from "./materialLayerCommands";

describe("material and layer commands", () => {
  it("persists floor and wall material assignments", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const changed = setLivingRoomWallMaterial(setLivingRoomFloorMaterial(project, project.materials[2]!.id), wall.id, project.materials[3]!.id);
    expect(changed.rooms[0]!.extensions?.floorMaterialId).toBe(project.materials[2]!.id);
    expect(changed.walls[0]!.materialId).toBe(project.materials[3]!.id);
  });

  it("removes hidden object and opening layers from the compiled scene", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" });
    const hidden = setLivingRoomLayerVisibility(setLivingRoomLayerVisibility(project, "furniture", false), "openings", false);
    const scene = compileLivingRoomScene(hidden);
    expect(scene.nodes.some((node) => node.sourceObjectId)).toBe(false);
    expect(scene.nodes.some((node) => node.metadata.role === "opening")).toBe(false);
  });

  it("uses one surface paint command for 2D data and compiled 3D materials", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const object = project.objects[0]!;
    const material = project.materials[4]!.id;
    const changed = paintLivingRoomSurface(
      paintLivingRoomSurface(project, { kind: "wall", wallId: wall.id }, material),
      { kind: "object", objectId: object.id, slotName: Object.keys(object.materialSlots)[0]! },
      material,
    );
    const scene = compileLivingRoomScene(changed);
    expect(changed.walls[0]!.materialId).toBe(material);
    expect(scene.nodes.some((node) => node.metadata.wallId === wall.id && node.primitives[0]?.materialId === material)).toBe(true);
    expect(changed.objects[0]!.materialSlots[Object.keys(object.materialSlots)[0]!]).toBe(material);
  });
});
