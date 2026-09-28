import { describe, expect, it } from "vitest";
import { createLivingRoomObject } from "./catalog";
import { createGoldenCabinetRunProject } from "./goldenRun/createProject";
import { effectiveSurfacePaintTarget, surfacePaintActiveMaterialId } from "./surfacePaintTarget";

const project = createGoldenCabinetRunProject();

describe("effectiveSurfacePaintTarget", () => {
  it("keeps paintable targets", () => {
    expect(effectiveSurfacePaintTarget("wall", false)).toBe("wall");
    expect(effectiveSurfacePaintTarget("selection", true)).toBe("selection");
  });

  it("falls back to the floor when the selection has no editable slot", () => {
    expect(effectiveSurfacePaintTarget("selection", false)).toBe("floor");
  });
});

describe("surfacePaintActiveMaterialId", () => {
  const base = { project, wallId: project.walls[0]?.id ?? null, selectedObjects: [], slotName: "" };

  it("reads the wall material for the wall target", () => {
    expect(surfacePaintActiveMaterialId({ ...base, target: "wall" })).toBe(project.walls[0]?.materialId ?? null);
  });

  it("reads the selected slot, or the primary finish without a slot", () => {
    const object = createLivingRoomObject("living:sofa-3-seat", {
      id: "sofa", roomId: project.activeRoomId, position: { x: 0, y: 0, z: 0 },
    });
    const [slot, materialId] = Object.entries(object.materialSlots)[0]!;
    expect(surfacePaintActiveMaterialId({ ...base, target: "selection", selectedObjects: [object], slotName: slot }))
      .toBe(materialId);
    expect(surfacePaintActiveMaterialId({ ...base, target: "selection", selectedObjects: [object] }))
      .not.toBeUndefined();
  });

  it("returns null for an empty selection", () => {
    expect(surfacePaintActiveMaterialId({ ...base, target: "selection" })).toBeNull();
  });
});
