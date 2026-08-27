import { describe, expect, it } from "vitest";
import {
  addLivingRoomOpening,
  compileLivingRoomScene,
  createLivingRoomStarterProject,
  createOpeningCatalogInstance,
  LIVING_ROOM_MATERIAL_IDS,
  updateLivingRoomOpening,
} from ".";

describe("Phase B opening 3D contract", () => {
  it("recompiles a catalog opening at the same wall offset and dimensions", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-26T00:00:00.000Z" });
    const wall = source.walls.find((candidate) => candidate.visible)!;
    const added = addLivingRoomOpening(source, createOpeningCatalogInstance({
      id: "phase-b-double-door", roomId: source.activeRoomId, wallId: wall.id,
      catalogItemId: "opening:door-double", offsetMm: 700,
    }));
    const edited = updateLivingRoomOpening(added, "phase-b-double-door", { offsetMm: 950, widthMm: 1500 });
    const scene = compileLivingRoomScene(edited);
    const node = scene.nodes.find((candidate) => candidate.metadata.openingId === "phase-b-double-door")!;
    const opening = edited.openings.find((candidate) => candidate.id === "phase-b-double-door")!;
    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    const ux = (wall.end.x - wall.start.x) / wallLength;
    const uz = (wall.end.z - wall.start.z) / wallLength;
    expect(node.metadata.catalogItemId).toBe("opening:door-double");
    expect(node.positionMm).toMatchObject({
      x: wall.start.x + ux * (opening.offsetMm + opening.widthMm / 2),
      z: wall.start.z + uz * (opening.offsetMm + opening.widthMm / 2),
    });
    const leaf = node.primitives[0];
    expect(leaf.kind).toBe("box");
    if (leaf.kind !== "box") throw new Error("Expected the door leaf to compile as a box");
    expect(leaf.sizeMm.width).toBe(opening.widthMm - 116);
    expect(leaf.sizeMm.height).toBe(opening.heightMm - 116);
  });

  it("applies inspector material slots to compiled opening primitives", () => {
    const source = createLivingRoomStarterProject({ now: "2026-08-26T00:00:00.000Z" });
    const wall = source.walls.find((candidate) => candidate.visible)!;
    const added = addLivingRoomOpening(source, createOpeningCatalogInstance({
      id: "phase-b-material-door", roomId: source.activeRoomId, wallId: wall.id,
      catalogItemId: "opening:door-single", offsetMm: 400,
    }));
    const painted = updateLivingRoomOpening(added, "phase-b-material-door", {
      materialSlots: {
        leaf: LIVING_ROOM_MATERIAL_IDS.walnut,
        frame: LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
        hardware: LIVING_ROOM_MATERIAL_IDS.warmStone,
      },
    });
    const node = compileLivingRoomScene(painted).nodes.find(
      (candidate) => candidate.metadata.openingId === "phase-b-material-door",
    )!;
    expect(node.metadata["material.leaf"]).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
    expect(node.metadata["material.frame"]).toBe(LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
    expect(node.metadata["material.hardware"]).toBe(LIVING_ROOM_MATERIAL_IDS.warmStone);
    const byId = Object.fromEntries(node.primitives.map((primitive) => [primitive.id, primitive]));
    expect(byId.door?.kind).toBe("box");
    expect(byId["frame-left"]?.kind).toBe("box");
    expect(byId.hardware?.kind).toBe("box");
    if (byId.door?.kind === "box") expect(byId.door.materialId).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
    if (byId["frame-left"]?.kind === "box") expect(byId["frame-left"].materialId).toBe(LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
    if (byId.hardware?.kind === "box") expect(byId.hardware.materialId).toBe(LIVING_ROOM_MATERIAL_IDS.warmStone);
  });
});
