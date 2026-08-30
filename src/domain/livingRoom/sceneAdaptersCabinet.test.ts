import { describe, expect, it } from "vitest";
import { createCabinetCutlist } from "../cabinetGeometry";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { clampCabinetConfig } from "../cabinetDimensions";
import { createLivingRoomObject } from "./catalog";
import { cabinetSceneRole } from "./cabinetSceneRoles";
import { compileCabinet, isCabinetGeometryFallback } from "./sceneAdaptersCabinet";
import { compileLivingRoomObjectNode } from "./sceneAdapters";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type { CompiledPrimitive } from "./sceneTypes";

const ROOM = "room-1";

function place(catalog: Parameters<typeof createLivingRoomObject>[0], id: string) {
  return createLivingRoomObject(catalog, {
    id,
    roomId: ROOM,
    position: { x: 0, y: 0, z: 0 },
  });
}

function ids(primitives: CompiledPrimitive[]) {
  return primitives.map((primitive) => primitive.id);
}

function roleOf(primitive: CompiledPrimitive) {
  const material = primitive.id.includes("back") ? "back"
    : primitive.id.includes("door") || primitive.id.includes("drawer") ? "door"
    : "board";
  return cabinetSceneRole(primitive.id, material);
}

describe("compileCabinet", () => {
  it("builds family-specific fronts, toe kicks, and shelves from normalized config", () => {
    const base = compileCabinet(place("living:base-cabinet-900", "base"));
    const wall = compileCabinet(place("living:wall-cabinet-900", "wall"));
    const drawer = compileCabinet(place("living:drawer-cabinet-900", "drawer"));
    const tall = compileCabinet(place("living:tall-pantry-600", "tall"));

    expect(ids(base).some((id) => id.includes("door"))).toBe(true);
    expect(ids(base)).toContain("toe-kick");
    expect(ids(wall).some((id) => id.includes("door"))).toBe(true);
    expect(ids(wall)).not.toContain("toe-kick");
    expect(ids(drawer).some((id) => id.includes("drawer"))).toBe(true);
    expect(ids(drawer).some((id) => id.includes("door"))).toBe(false);
    expect(ids(tall)).toContain("left-end-panel");
    expect(tall.some((part) => part.sizeMm.height > 1500)).toBe(true);
    expect(base.some((part) => roleOf(part) === "shelves")).toBe(true);
  });

  it("maps semantic material slots onto geometry groups", () => {
    const object = {
      ...place("living:base-cabinet-900", "base"),
      materialSlots: {
        carcass: "mat-carcass",
        fronts: "mat-fronts",
        back: "mat-back",
        shelves: "mat-shelves",
      },
    };
    const parts = compileCabinet(object);
    expect(parts.find((part) => part.id === "left-side-panel")?.materialId).toBe("mat-carcass");
    expect(parts.find((part) => part.id.includes("door"))?.materialId).toBe("mat-fronts");
    expect(parts.find((part) => part.id === "back-panel")?.materialId).toBe("mat-back");
    expect(parts.find((part) => part.id.startsWith("shelf-"))?.materialId).toBe("mat-shelves");
  });

  it("updates 3D, cutlist, and cost from one width edit", () => {
    const object = place("living:base-cabinet-900", "base");
    const resized = {
      ...object,
      dimensions: { ...object.dimensions, widthMm: 1200 },
    };
    const cabinet = cabinetFromObject(resized)!;
    const config = clampCabinetConfig(cabinet.config);
    const top = compileCabinet(resized).find((part) => part.id === "top-panel");
    const cutlist = createCabinetCutlist(config);
    expect(config.dimensions.width).toBe(1200);
    expect(top?.sizeMm.width).toBeGreaterThan(1000);
    expect(cutlist.find((item) => item.key === "top-bottom-panels")?.lengthMm).toBeGreaterThan(1000);
  });

  it("renders composition fillers as slim strips, not full cabinets", () => {
    const object = place("living:base-cabinet-900", "base");
    const cabinet = cabinetFromObject(object)!;
    const withFillers = {
      ...object,
      extensions: {
        ...object.extensions,
        cabinetPlanning: {
          ...(object.extensions?.cabinetPlanning as object),
          config: clampCabinetConfig({
            ...cabinet.config,
            composition: {
              ...cabinet.config.composition!,
              fillers: { leftMm: 80, rightMm: 60 },
            },
          }),
        },
      },
    };
    const parts = compileCabinet(withFillers);
    const left = parts.find((part) => part.id === "filler-left");
    expect(left?.sizeMm.width).toBe(80);
    expect(left?.sizeMm.width).toBeLessThan(object.dimensions.widthMm / 4);
    expect(ids(parts).filter((id) => id.startsWith("filler-"))).toHaveLength(2);
  });

  it("labels a safe fallback when identity cannot compile", () => {
    const orphan = {
      ...place("living:base-cabinet-900", "orphan"),
      catalogItemId: "living:unknown-cabinet",
      extensions: {},
      parameters: {},
    };
    const parts = compileCabinet(orphan);
    expect(isCabinetGeometryFallback(parts)).toBe(true);
    expect(parts[0]?.id).toBe("fallback-carcass");
  });

  it("keeps 3D selection on the canonical cabinet id and mounts wall cabinets", () => {
    const wall = place("living:wall-cabinet-900", "wall-1");
    const node = compileLivingRoomObjectNode(wall);
    expect(node.sourceObjectId).toBe("wall-1");
    expect(node.adapterId).toBe("wall-cabinet-v1");
    expect(node.positionMm.y).toBe(1400);
    expect(node.metadata.geometry).toBe("shared-cabinet");
    expect(node.renderBinding.strategy).toBe("procedural");
    expect(node.primitives[0]?.materialId).not.toBe(LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
  });
});
