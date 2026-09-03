import { describe, expect, it } from "vitest";
import {
  kenneyItemId,
  snapshotCatalogMaterial,
  lookupBuiltInCatalogMaterial,
} from "../catalog";
import { createLivingRoomObject, createLivingRoomStarterProject } from ".";
import {
  applyMaterialToSelection,
  commonMaterialSlots,
  editableCommonMaterialSlots,
  isSelectionSlotEditable,
  materialsCompatibleWithSelectionSlot,
  primaryMaterialId,
} from "./paintSelection";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type { InteriorObjectEntity } from "../interiorProject";

describe("I5 paint selection", () => {
  it("finds slots shared across the selection", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-28T00:00:00.000Z" });
    const a = createLivingRoomObject("living:base-cabinet-900", {
      id: "a", roomId: project.activeRoomId, position: { x: 0, y: 0, z: 0 },
    });
    const b = createLivingRoomObject("living:wall-cabinet-900", {
      id: "b", roomId: project.activeRoomId, position: { x: 900, y: 0, z: 0 },
    });
    expect(commonMaterialSlots([a, b]).sort()).toEqual(["back", "carcass", "fronts", "shelves"]);
  });

  it("applies one material to the shared slot on every selected object", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-28T00:00:00.000Z" });
    const a = createLivingRoomObject("living:base-cabinet-900", {
      id: "a", roomId: source.activeRoomId, position: { x: 0, y: 0, z: 0 },
    });
    const b = createLivingRoomObject("living:wall-cabinet-900", {
      id: "b", roomId: source.activeRoomId, position: { x: 900, y: 0, z: 0 },
    });
    const project = { ...source, objects: [a, b] };
    const painted = applyMaterialToSelection(project, ["a", "b"], LIVING_ROOM_MATERIAL_IDS.naturalOak, "fronts");
    expect(painted.objects.find((object) => object.id === "a")?.materialSlots.fronts).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);
    expect(painted.objects.find((object) => object.id === "b")?.materialSlots.fronts).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);
    expect(primaryMaterialId(painted.objects[0]!)).toBe(LIVING_ROOM_MATERIAL_IDS.naturalOak);
  });

  it("skips objects that lack the requested slot", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-28T00:00:00.000Z" });
    const sofa = createLivingRoomObject("living:sofa-3-seat", {
      id: "sofa", roomId: source.activeRoomId, position: { x: 0, y: 0, z: 0 },
    });
    const project = { ...source, objects: [sofa] };
    const painted = applyMaterialToSelection(project, ["sofa"], LIVING_ROOM_MATERIAL_IDS.oliveFabric, "fronts");
    expect(painted.objects[0]!.materialSlots).toEqual(sofa.materialSlots);
  });

  it("tints the plan from fronts when that slot exists", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-28T00:00:00.000Z" });
    const cabinet = createLivingRoomObject("living:base-cabinet-900", {
      id: "cab", roomId: project.activeRoomId, position: { x: 0, y: 0, z: 0 },
    });
    expect(primaryMaterialId(cabinet)).toBe(cabinet.materialSlots.fronts);
  });

  it("omits locked shared slots and intersects compatible finishes", () => {
    const oatmeal = lookupBuiltInCatalogMaterial("material:core:fabric-oatmeal:v1")!;
    const metal = lookupBuiltInCatalogMaterial("material:core:metal-charcoal:v1")!;
    const materials = [
      snapshotCatalogMaterial(oatmeal, "proj-oatmeal"),
      snapshotCatalogMaterial(metal, "proj-metal"),
    ];
    const tv: InteriorObjectEntity = {
      id: "tv",
      roomId: "room-1",
      kind: "furniture",
      category: "media",
      catalogItemId: kenneyItemId("televisionModern"),
      name: "TV",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 1200, heightMm: 700, depthMm: 80 },
      materialSlots: { screen: "proj-metal", frame: "proj-oatmeal" },
      parameters: {},
    };
    const sofa: InteriorObjectEntity = {
      ...tv,
      id: "sofa",
      catalogItemId: kenneyItemId("loungeSofa"),
      materialSlots: { upholstery: "proj-oatmeal", legs: "proj-metal" },
    };
    expect(isSelectionSlotEditable([tv], "screen")).toBe(false);
    expect(editableCommonMaterialSlots([tv])).toEqual(["frame"]);
    expect(commonMaterialSlots([tv]).includes("screen")).toBe(true);
    const fabricOnly = materialsCompatibleWithSelectionSlot(materials, [sofa], "upholstery");
    expect(fabricOnly.map((material) => material.id)).toEqual(["proj-oatmeal"]);
  });
});
