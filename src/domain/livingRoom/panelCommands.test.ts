import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile, translatePlanWall } from "../interiorProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import {
  addWallPanel,
  reflowPanelsForWalls,
  setPanelVisible,
  updatePanelAttachment,
} from "./panelCommands";
import { readPanelAttachment } from "./panelAttachment";
import { createLivingRoomStarterProject } from "./preset";
import { applyMaterialColour } from "./applyMaterialColour";

describe("wall panels (M5)", () => {
  it("adds two panels on one wall with §2.1 attachment and persists save/reopen", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wallId = project.walls[0]!.id;
    const wallGeometry = { ...project.walls[0]! };

    const withFirst = addWallPanel(project, wallId, { alongMm: 900, dimensions: { widthMm: 800 } });
    const withSecond = addWallPanel(withFirst, wallId, { alongMm: 2200, dimensions: { widthMm: 800 } });
    const panels = withSecond.objects.filter((object) => object.category === "wall-panel");
    expect(panels).toHaveLength(2);

    for (const panel of panels) {
      const attachment = readPanelAttachment(panel);
      expect(attachment).toMatchObject({
        wallId,
        wallSide: "interior",
        visible: true,
      });
      expect(attachment?.alongMm).toBeGreaterThan(0);
    }

    expect(withSecond.walls.find((wall) => wall.id === wallId)).toEqual(wallGeometry);

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(withSecond)).document;
    const reopenedPanels = reopened.objects.filter((object) => object.category === "wall-panel");
    expect(reopenedPanels).toHaveLength(2);
    expect(readPanelAttachment(reopenedPanels[0]!)?.wallId).toBe(wallId);
    expect(reopened.walls.find((wall) => wall.id === wallId)?.start).toEqual(wallGeometry.start);
  });

  it("recolours one panel and hides another without hiding the host wall", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wallId = project.walls[0]!.id;
    const withPanels = addWallPanel(
      addWallPanel(project, wallId, { alongMm: 800 }),
      wallId,
      { alongMm: 2000 },
    );
    const [first, second] = withPanels.objects.filter((object) => object.category === "wall-panel");
    expect(first && second).toBeTruthy();

    const faceId = first!.materialSlots.face!;
    const recoloured = applyMaterialColour(withPanels, {
      materialId: faceId,
      color: "#334455",
      rebinds: [{ kind: "object", objectId: first!.id, slotName: "face" }],
    });
    const hidden = setPanelVisible(recoloured, second!.id, false);

    expect(hidden.walls.find((wall) => wall.id === wallId)?.visible).toBe(true);
    expect(readPanelAttachment(hidden.objects.find((object) => object.id === second!.id)!)?.visible).toBe(false);

    const scene = compileLivingRoomScene(hidden);
    expect(scene.nodes.some((node) => node.sourceObjectId === first!.id)).toBe(true);
    expect(scene.nodes.some((node) => node.sourceObjectId === second!.id)).toBe(false);
  });

  it("keeps panels attached when the host wall moves", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200 });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const before = { ...panel.position };

    const moved = translatePlanWall(withPanel, wall.id, { x: 400, z: 0 });
    const reflowed = reflowPanelsForWalls(moved, [wall.id]);
    const after = reflowed.objects.find((object) => object.id === panel.id)!;

    expect(readPanelAttachment(after)?.wallId).toBe(wall.id);
    expect(after.position.x).not.toBe(before.x);
    expect(reflowed.walls.find((item) => item.id === wall.id)?.start.x).not.toBe(wall.start.x);
  });

  it("updates alongMm and floorOffsetMm without mutating wall geometry", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id);
    const panelId = withPanel.objects.find((object) => object.category === "wall-panel")!.id;
    const wallBefore = { ...withPanel.walls.find((item) => item.id === wall.id)! };

    const updated = updatePanelAttachment(withPanel, panelId, {
      alongMm: 1500,
      floorOffsetMm: 200,
      wallSide: "interior",
    });
    const panel = updated.objects.find((object) => object.id === panelId)!;
    expect(readPanelAttachment(panel)).toMatchObject({
      alongMm: 1500,
      floorOffsetMm: 200,
    });
    expect(panel.position.y).toBe(200);
    expect(updated.walls.find((item) => item.id === wall.id)).toEqual(wallBefore);
  });
});
