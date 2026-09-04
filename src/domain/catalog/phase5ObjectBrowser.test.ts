import { describe, expect, it } from "vitest";
import {
  browserFootprintFitsRoom,
  browserPlacementYMmForItem,
  defaultBrowserPlacementPosition,
  isObjectBrowserPlaceable,
  KENNEY_TEMPLATE_CURATED_STEMS,
  kenneyItemId,
  listObjectBrowserCards,
  listObjectBrowserItems,
  lookupBuiltInCatalogItem,
  OBJECT_BROWSER_CATEGORIES,
  placeObjectBrowserItem,
  toObjectBrowserCard,
} from ".";
import {
  drawRoomFromPoints,
  pointInRoomPolygon,
  rectanglePoints,
  roomPlanPolygon,
  roomPlanViewBounds,
} from "../interiorProject";
import type { InteriorProject } from "../interiorProject";
import {
  applyPlannerStarterTemplate,
  createLivingRoomStarterProject,
  L_ROOM_STARTER_POINTS,
} from "../livingRoom";

const NOW = "2026-09-04T00:00:00.000Z";

function emptyProject(): InteriorProject {
  return {
    schemaVersion: 1,
    id: "p",
    name: "t",
    createdAt: NOW,
    updatedAt: NOW,
    unitSystem: "mm",
    activeRoomId: "room-1",
    rooms: [{
      id: "room-1",
      name: "Room",
      heightMm: 2700,
      dimensions: { widthMm: 5000, depthMm: 4000, heightMm: 2700 },
    }],
    walls: [],
    openings: [],
    objects: [],
    materials: [],
    lights: [],
    cameras: [],
    surfaces: [],
  } as InteriorProject;
}

describe("Phase 5 catalog object browser", () => {
  it("exposes the curated 30–35 items across roadmap categories", () => {
    const all = listObjectBrowserItems();
    expect(all.length).toBeGreaterThanOrEqual(30);
    expect(all.length).toBeLessThanOrEqual(35);
    expect(all).toHaveLength(KENNEY_TEMPLATE_CURATED_STEMS.length);
    expect(OBJECT_BROWSER_CATEGORIES.map((entry) => entry.id)).toEqual([
      "all", "seating", "tables", "beds", "storage", "kitchen",
      "bathroom", "office", "lighting", "decor", "utility",
    ]);
    expect(listObjectBrowserItems({ categoryId: "seating" }).every((item) => item.category === "seating")).toBe(true);
    expect(listObjectBrowserItems({ categoryId: "bathroom" }).some((item) => item.id === kenneyItemId("toilet"))).toBe(true);
    expect(listObjectBrowserItems({ categoryId: "office" }).some((item) => item.id === kenneyItemId("laptop"))).toBe(true);
    expect(listObjectBrowserItems({ categoryId: "kitchen" }).some((item) => item.id === kenneyItemId("kitchenFridge"))).toBe(true);
  });

  it("searches normalized name, category, and tags", () => {
    const sofa = listObjectBrowserItems({ text: "lounge-sofa" });
    expect(sofa.some((item) => item.id === kenneyItemId("loungeSofa"))).toBe(true);
    const bathroom = listObjectBrowserItems({ text: "bathroom" });
    expect(bathroom.length).toBeGreaterThan(0);
    expect(bathroom.every((item) => normalizeIncludes(item, "bathroom"))).toBe(true);
    const lighting = listObjectBrowserItems({ text: "floor lamp" });
    expect(lighting.some((item) => item.id === kenneyItemId("lampRoundFloor"))).toBe(true);
  });

  it("builds cards with isometric thumbnails, size, and finish indicators", () => {
    const cards = listObjectBrowserCards({ categoryId: "seating", text: "sofa" });
    const sofa = cards.find((card) => card.id === kenneyItemId("loungeSofa"))!;
    expect(sofa.name).toBe("Lounge Sofa");
    expect(sofa.widthMm).toBe(2100);
    expect(sofa.depthMm).toBe(900);
    expect(sofa.thumbnailUrl).toContain("loungeSofa_NE.png");
    expect(sofa.finishesEditable).toBe(true);
    expect(toObjectBrowserCard(listObjectBrowserItems({ text: "potted" })[0]!).thumbnailUrl).toBeTruthy();
  });

  it("places browser items at catalog dimensions with finish snapshots", () => {
    const placed = placeObjectBrowserItem(emptyProject(), kenneyItemId("loungeSofa"), {
      objectId: "obj-sofa",
      roomId: "room-1",
    });
    const object = placed.objects.find((candidate) => candidate.id === "obj-sofa")!;
    expect(object.dimensions).toEqual({ widthMm: 2100, heightMm: 850, depthMm: 900 });
    expect(object.catalogItemVersion).toBe(1);
    expect(object.materialSlots.upholstery).toBeTruthy();
    expect(placed.materials.some((material) => material.id === object.materialSlots.upholstery)).toBe(true);
  });

  it("uses curated elevations for surface and wall items", () => {
    expect(browserPlacementYMmForItem(lookupBuiltInCatalogItem(kenneyItemId("lampRoundTable"))!)).toBe(550);
    expect(browserPlacementYMmForItem(lookupBuiltInCatalogItem(kenneyItemId("televisionModern"))!)).toBe(450);
    expect(browserPlacementYMmForItem(lookupBuiltInCatalogItem(kenneyItemId("pillow"))!)).toBe(620);
    expect(browserPlacementYMmForItem(lookupBuiltInCatalogItem(kenneyItemId("hoodModern"))!)).toBe(1600);
    const hood = placeObjectBrowserItem(emptyProject(), kenneyItemId("hoodModern"), {
      objectId: "obj-hood",
      roomId: "room-1",
    }).objects[0]!;
    expect(hood.position.y).toBe(1600);
  });

  it("centers default placement on the active room plan bounds", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ projectName: "Offset", now: NOW }),
      "blank-room",
    );
    const first = drawRoomFromPoints(blank, {
      kind: "rectangle",
      points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
    });
    const drawn = drawRoomFromPoints(first, {
      kind: "rectangle",
      points: rectanglePoints({ x: 7000, z: 0 }, { x: 11000, z: 3000 }),
    });
    const roomId = drawn.activeRoomId;
    const bounds = roomPlanViewBounds(drawn, roomId);
    const sofa = lookupBuiltInCatalogItem(kenneyItemId("loungeSofa"))!;
    const position = defaultBrowserPlacementPosition(drawn, roomId, sofa);
    expect(bounds.centerX).toBe(9000);
    expect(bounds.centerZ).toBe(1500);
    expect(position.x).toBe(bounds.centerX - 225);
    expect(position.z).toBe(bounds.centerZ - 150);
    const placed = placeObjectBrowserItem(drawn, kenneyItemId("loungeSofa"), {
      objectId: "obj-sofa",
      roomId,
    });
    expect(placed.objects[0]!.position.x).toBe(position.x);
    expect(placed.objects[0]!.position.z).toBe(position.z);
  });

  it("places inside concave L rooms instead of the AABB cutout center", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ projectName: "L", now: NOW }),
      "blank-room",
    );
    const drawn = drawRoomFromPoints(blank, {
      kind: "polygon",
      points: [...L_ROOM_STARTER_POINTS],
    });
    const roomId = drawn.activeRoomId;
    const polygon = roomPlanPolygon(drawn, roomId)!;
    const bounds = roomPlanViewBounds(drawn, roomId);
    const cutoutCenter = { x: bounds.centerX, z: bounds.centerZ };
    expect(pointInRoomPolygon(cutoutCenter, polygon)).toBe(false);

    const plant = lookupBuiltInCatalogItem(kenneyItemId("pottedPlant"))!;
    const position = defaultBrowserPlacementPosition(drawn, roomId, plant);
    expect(pointInRoomPolygon({ x: position.x, z: position.z }, polygon)).toBe(true);
    expect(browserFootprintFitsRoom(
      polygon,
      { x: position.x, z: position.z },
      plant.dimensionsMm.width,
      plant.dimensionsMm.depth,
    )).toBe(true);
    expect(position.x === cutoutCenter.x && position.z === cutoutCenter.z).toBe(false);
  });

  it("rejects blocked items and treats deprecated as not placeable", () => {
    expect(() =>
      placeObjectBrowserItem(emptyProject(), kenneyItemId("wall"), {
        objectId: "obj-wall",
        roomId: "room-1",
      }),
    ).toThrow(/not available in the object browser/);
    const sofa = lookupBuiltInCatalogItem(kenneyItemId("loungeSofa"))!;
    expect(isObjectBrowserPlaceable(sofa)).toBe(true);
    expect(isObjectBrowserPlaceable({ ...sofa, lifecycle: "deprecated" })).toBe(false);
    expect(isObjectBrowserPlaceable({ ...sofa, lifecycle: "blocked" })).toBe(false);
  });
});

function normalizeIncludes(
  item: { name: string; category: string; subcategory: string; tags: string[] },
  needle: string,
): boolean {
  return [item.name, item.category, item.subcategory, ...item.tags]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
