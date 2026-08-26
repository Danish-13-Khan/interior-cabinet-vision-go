import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom";
import { drawRoomFromPoints } from "./roomDrawing";
import {
  createSurfaceZone,
  deleteSurfaceZone,
  isGeneratedRoomSurface,
  setSurfaceZoneMaterial,
} from "./surfaceEditing";
import { createWallSegmentResult } from "./wallEditing";
import { placeStructuralColumn } from "../livingRoom/structuralCommands";
import { compileLivingRoomScene } from "../livingRoom/sceneCompiler";

const NOW = "2026-08-27T00:00:00.000Z";
const ROOM_POLYGON = [
  { x: -2000, z: -1500 }, { x: 2000, z: -1500 },
  { x: 2000, z: 1500 }, { x: -2000, z: 1500 },
];
const ZONE = [
  { x: -800, z: -600 }, { x: 800, z: -600 },
  { x: 800, z: 600 }, { x: -800, z: 600 },
];

function roomProject() {
  return drawRoomFromPoints(createLivingRoomStarterProject({ now: NOW }), {
    kind: "polygon",
    points: ROOM_POLYGON,
  });
}

describe("Phase E surfaces and structurals", () => {
  it("creates an in-room floor surface zone with material", () => {
    const base = roomProject();
    const materialId = base.materials[0]!.id;
    const next = createSurfaceZone(base, { points: ZONE, materialId });
    const zone = next.surfaces.find((surface) => surface.extensions?.createdBy === "draw-surface");
    expect(zone?.polygon).toHaveLength(4);
    expect(zone?.materialId).toBe(materialId);
    expect(isGeneratedRoomSurface(next.surfaces.find((surface) => surface.kind === "floor" && surface.roomId === base.activeRoomId)!)).toBe(true);
  });

  it("rejects surface zones outside the room boundary", () => {
    const base = roomProject();
    const outside = createSurfaceZone(base, {
      points: [{ x: 5000, z: 5000 }, { x: 6000, z: 5000 }, { x: 6000, z: 6000 }],
      materialId: base.materials[0]!.id,
    });
    expect(outside.surfaces.some((surface) => surface.extensions?.createdBy === "draw-surface")).toBe(false);
  });

  it("updates and deletes authored surface zones", () => {
    const base = createSurfaceZone(roomProject(), { points: ZONE, materialId: roomProject().materials[0]!.id });
    const zone = base.surfaces.find((surface) => surface.extensions?.createdBy === "draw-surface")!;
    const alt = base.materials[1]?.id ?? base.materials[0]!.id;
    const updated = setSurfaceZoneMaterial(base, zone.id, alt);
    expect(updated.surfaces.find((surface) => surface.id === zone.id)?.materialId).toBe(alt);
    const deleted = deleteSurfaceZone(updated, zone.id);
    expect(deleted.surfaces.some((surface) => surface.id === zone.id)).toBe(false);
  });

  it("draws partition walls and compiles structural columns and surface zones", () => {
    const base = roomProject();
    const partition = createWallSegmentResult(base, {
      start: { x: 0, z: -1000 }, end: { x: 0, z: 1000 }, kind: "partition",
    });
    const wall = partition.project.walls.find((item) => item.id === partition.wallId);
    expect(wall?.extensions?.isPartition).toBe(true);

    const withZone = createSurfaceZone(partition.project, { points: ZONE, materialId: base.materials[0]!.id });
    const withColumn = placeStructuralColumn(withZone, "column-1", { x: 500, z: 500 });
    expect(withColumn.objects.some((object) => object.category === "structural-column")).toBe(true);
    const scene = compileLivingRoomScene(withColumn);
    expect(scene.nodes.some((node) => node.metadata.role === "structural")).toBe(true);
    expect(scene.nodes.some((node) => node.metadata.role === "surface")).toBe(true);
  });
});
