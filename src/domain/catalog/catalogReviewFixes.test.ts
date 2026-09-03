import { describe, expect, it } from "vitest";
import {
  catalogSlotPoliciesForObject,
  catalogVersionPinFallbackWarning,
  countMaterialReferences,
  kenneyItemId,
  lookupBuiltInCatalogItem,
  pinnedCatalogItemVersion,
} from ".";
import { createObjectRenderBinding } from "../livingRoom";
import { createLivingRoomStarterProject } from "../livingRoom";
import type { InteriorObjectEntity } from "../interiorProject";

describe("catalog review fixes", () => {
  it("counts floor finish once across room extension and generated surface", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-04T00:00:00.000Z" });
    const floorId = String(project.rooms[0]!.extensions?.floorMaterialId);
    expect(project.surfaces.some((surface) => surface.kind === "floor" && surface.materialId === floorId)).toBe(true);
    expect(countMaterialReferences(project, floorId)).toBe(1);
  });

  it("does not fall through a pinned catalog version", () => {
    const id = kenneyItemId("loungeSofa");
    const current = lookupBuiltInCatalogItem(id)!;
    const object: InteriorObjectEntity = {
      id: "obj",
      roomId: "room-1",
      kind: "furniture",
      category: "seating",
      catalogItemId: id,
      catalogItemVersion: current.version + 1,
      name: "Pinned sofa",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 2100, heightMm: 850, depthMm: 900 },
      materialSlots: {},
      parameters: {},
    };
    expect(pinnedCatalogItemVersion(object)).toBe(current.version + 1);
    expect(lookupBuiltInCatalogItem(id, object.catalogItemVersion)).toBeNull();
    expect(catalogSlotPoliciesForObject(object)).toBeUndefined();
    expect(catalogVersionPinFallbackWarning(object)).toMatch(/safe fallback/);
    const binding = createObjectRenderBinding(object);
    expect(binding.strategy).toBe("procedural");
    expect(binding.warnings?.[0]).toMatch(/safe fallback/);
  });

  it("reads legacy extension pins and first-class pins", () => {
    expect(pinnedCatalogItemVersion({ extensions: { catalogItemVersion: 3 } })).toBe(3);
    expect(pinnedCatalogItemVersion({ catalogItemVersion: 2, extensions: { catalogItemVersion: 9 } })).toBe(2);
  });
});
