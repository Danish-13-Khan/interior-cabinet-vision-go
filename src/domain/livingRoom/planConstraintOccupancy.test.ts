import { describe, expect, it } from "vitest";
import type { InteriorObjectEntity } from "../interiorProject";
import {
  isPlanObstacle,
  isRugLikeObject,
  isSurfaceMountedObject,
  isSurfaceRestingOnSupport,
  isWallMirrorLikeObject,
  shouldIgnoreCollisionPair,
  verticallySeparated,
} from "./planConstraintOccupancy";
import {
  createLivingRoomStarterProject,
  inspectLivingRoomPlan,
  moveLivingRoomObject,
} from ".";

const NOW = "2026-09-04T13:45:00.000Z";

function objectStub(
  partial: Partial<InteriorObjectEntity> & Pick<InteriorObjectEntity, "id" | "catalogItemId" | "category" | "name">,
): InteriorObjectEntity {
  return {
    roomId: "room",
    kind: "furniture",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 1000, heightMm: 800, depthMm: 600 },
    materialSlots: {},
    parameters: {},
    ...partial,
  };
}

describe("plan constraint occupancy", () => {
  it("keeps mirrors as boundary obstacles while skipping collision with supports", () => {
    const rug = objectStub({
      id: "rug",
      catalogItemId: "kenney:rug-rectangle",
      category: "decor",
      name: "Rectangle Rug",
      dimensions: { widthMm: 2000, heightMm: 10, depthMm: 1400 },
      extensions: { placement: "floor" },
    });
    const lamp = objectStub({
      id: "lamp",
      catalogItemId: "kenney:lamp-round-table",
      category: "lighting",
      name: "Round Table Lamp",
      position: { x: 0, y: 550, z: 0 },
      dimensions: { widthMm: 300, heightMm: 450, depthMm: 300 },
      extensions: { placement: "surface" },
    });
    const mirror = objectStub({
      id: "mirror",
      catalogItemId: "kenney:bathroom-mirror",
      category: "bathroom",
      name: "Bathroom Mirror",
      position: { x: 0, y: 1100, z: -400 },
      dimensions: { widthMm: 600, heightMm: 800, depthMm: 50 },
      extensions: { placement: "wall" },
    });
    const sink = objectStub({
      id: "sink",
      catalogItemId: "kenney:bathroom-sink",
      category: "bathroom",
      name: "Bathroom Sink",
      position: { x: 0, y: 0, z: -400 },
      dimensions: { widthMm: 600, heightMm: 850, depthMm: 450 },
    });
    expect(isRugLikeObject(rug)).toBe(true);
    expect(isSurfaceMountedObject(lamp)).toBe(true);
    expect(isWallMirrorLikeObject(mirror)).toBe(true);
    expect(isPlanObstacle(rug)).toBe(false);
    expect(isPlanObstacle(lamp)).toBe(true);
    expect(isPlanObstacle(mirror)).toBe(true);
    expect(shouldIgnoreCollisionPair(mirror, sink)).toBe(true);
  });

  it("skips support stacking but flags unsupported and surface-surface overlaps", () => {
    const nightstand = objectStub({
      id: "nightstand",
      catalogItemId: "kenney:cabinet-bed-drawer-table",
      category: "beds-and-bedroom",
      name: "Nightstand",
      dimensions: { widthMm: 450, heightMm: 550, depthMm: 400 },
    });
    const lamp = objectStub({
      id: "lamp",
      catalogItemId: "kenney:lamp-round-table",
      category: "lighting",
      name: "Lamp",
      position: { x: 0, y: 550, z: 0 },
      dimensions: { widthMm: 300, heightMm: 450, depthMm: 300 },
      extensions: { placement: "surface" },
    });
    const embeddedLamp = { ...lamp, id: "lamp-embedded", position: { x: 0, y: 0, z: 0 } };
    const otherLamp = objectStub({
      id: "lamp-b",
      catalogItemId: "kenney:lamp-round-table",
      category: "lighting",
      name: "Other Lamp",
      position: { x: 50, y: 550, z: 0 },
      dimensions: { widthMm: 300, heightMm: 450, depthMm: 300 },
      extensions: { placement: "surface" },
    });
    const bed = objectStub({
      id: "bed",
      catalogItemId: "kenney:bed-double",
      category: "beds-and-bedroom",
      name: "Double Bed",
      dimensions: { widthMm: 1600, heightMm: 900, depthMm: 2100 },
    });
    const pillow = objectStub({
      id: "pillow",
      catalogItemId: "kenney:pillow",
      category: "beds-and-bedroom",
      name: "Pillow",
      position: { x: 0, y: 620, z: 0 },
      dimensions: { widthMm: 600, heightMm: 200, depthMm: 400 },
      extensions: { placement: "surface" },
    });
    const sofa = objectStub({
      id: "sofa",
      catalogItemId: "kenney:lounge-sofa",
      category: "seating",
      name: "Sofa",
      position: { x: 1800, y: 0, z: 0 },
      dimensions: { widthMm: 1200, heightMm: 850, depthMm: 900 },
    });
    const lampBesideSofa = {
      ...lamp,
      id: "lamp-beside",
      position: { x: 900, y: 400, z: 0 },
    };
    expect(isSurfaceRestingOnSupport(lamp, nightstand)).toBe(true);
    expect(shouldIgnoreCollisionPair(lamp, nightstand)).toBe(true);
    expect(isSurfaceRestingOnSupport(embeddedLamp, nightstand)).toBe(false);
    expect(shouldIgnoreCollisionPair(embeddedLamp, nightstand)).toBe(false);
    expect(isSurfaceRestingOnSupport(pillow, bed)).toBe(true);
    expect(shouldIgnoreCollisionPair(lamp, otherLamp)).toBe(false);
    expect(isSurfaceRestingOnSupport(lampBesideSofa, sofa)).toBe(false);
    expect(shouldIgnoreCollisionPair(lampBesideSofa, sofa)).toBe(false);
    expect(verticallySeparated(
      objectStub({ id: "base", catalogItemId: "a", category: "cabinet", name: "Base", dimensions: { widthMm: 900, heightMm: 720, depthMm: 600 } }),
      objectStub({ id: "wall", catalogItemId: "b", category: "cabinet", name: "Wall", position: { x: 0, y: 1400, z: 0 }, dimensions: { widthMm: 900, heightMm: 720, depthMm: 350 } }),
    )).toBe(true);
  });

  it("reports outside-room for a surface lamp moved far outside the room", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const accessory = project.objects.find((object) => object.category === "accessory")
      ?? project.objects[0]!;
    const surfaceLamp: InteriorObjectEntity = {
      ...accessory,
      id: "surface-lamp-out",
      category: "lighting",
      catalogItemId: "kenney:lamp-round-table",
      name: "Round Table Lamp",
      position: { x: 10000, y: 550, z: 0 },
      dimensions: { widthMm: 300, heightMm: 450, depthMm: 300 },
      extensions: { placement: "surface" },
    };
    const withLamp = { ...project, objects: [...project.objects, surfaceLamp] };
    expect(inspectLivingRoomPlan(withLamp).some((issue) => (
      issue.code === "outside-room" && issue.objectIds.includes(surfaceLamp.id)
    ))).toBe(true);
  });

  it("does not treat rug-under-sofa stacking as a blocking collision", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const sofa = project.objects.find((object) => object.category === "sofa")!;
    const rug = project.objects.find((object) => object.category === "rug")!;
    const stacked = moveLivingRoomObject(project, rug.id, { ...sofa.position });
    expect(inspectLivingRoomPlan(stacked).some((issue) => (
      issue.code === "overlap" && issue.objectIds.includes(rug.id)
    ))).toBe(false);
  });
});
