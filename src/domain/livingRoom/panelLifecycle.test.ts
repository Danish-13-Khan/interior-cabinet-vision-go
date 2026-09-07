import { describe, expect, it } from "vitest";
import {
  applyWallPlanPatch,
  splitPlanWallResult,
  wallLengthMm,
} from "../interiorProject";
import { addWallPanel, reflowPanelsForWalls, resizeWallPanel } from "./panelCommands";
import { dragWallPanel } from "./panelDrag";
import { duplicateWallPanel } from "./panelLifecycle";
import { readPanelAttachment, resolvePanelPose } from "./panelAttachment";
import { createLivingRoomStarterProject } from "./preset";
import { wallLength } from "./wallSegmentPlacement";

describe("wall panel lifecycle (M5 hardening)", () => {
  it("drag updates alongMm and keeps full §2.1 attachment", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const length = wallLength(wall);
    const ux = (wall.end.x - wall.start.x) / length;
    const uz = (wall.end.z - wall.start.z) / length;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200, dimensions: { widthMm: 800 } });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const before = readPanelAttachment(panel)!;

    const dragged = dragWallPanel(withPanel, panel, {
      x: panel.position.x + ux * 500,
      y: panel.position.y,
      z: panel.position.z + uz * 500,
    });
    const after = readPanelAttachment(dragged)!;

    expect(after).toMatchObject({
      wallId: before.wallId,
      floorOffsetMm: before.floorOffsetMm,
      wallSide: before.wallSide,
      visible: true,
    });
    expect(after.alongMm).toBeGreaterThan(before.alongMm);
  });

  it("keyboard-style nudge updates alongMm via dragWallPanel", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const length = wallLength(wall);
    const ux = (wall.end.x - wall.start.x) / length;
    const uz = (wall.end.z - wall.start.z) / length;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200, dimensions: { widthMm: 800 } });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const before = readPanelAttachment(panel)!;
    const nudged = dragWallPanel(withPanel, panel, {
      x: panel.position.x + ux * 120,
      y: panel.position.y,
      z: panel.position.z + uz * 120,
    });
    expect(readPanelAttachment(nudged)!.alongMm).not.toBe(before.alongMm);
    expect(readPanelAttachment(nudged)).toMatchObject({
      wallId: before.wallId,
      wallSide: before.wallSide,
      visible: true,
    });
  });

  it("duplicate offsets alongMm and regenerates pose without XYZ copy conflict", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 900, dimensions: { widthMm: 600 } });
    const source = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const sourceAlong = readPanelAttachment(source)!.alongMm;

    const duplicated = duplicateWallPanel(withPanel, source.id, "panel-copy-1");
    const copy = duplicated.objects.find((object) => object.id === "panel-copy-1")!;
    const copyAtt = readPanelAttachment(copy)!;

    expect(copyAtt.wallId).toBe(wall.id);
    expect(copyAtt.alongMm).toBeGreaterThan(sourceAlong);
    expect(copy.position.x).not.toBe(source.position.x + 150);
    expect(copy.position.z).not.toBe(source.position.z + 150);

    const reflowed = reflowPanelsForWalls(duplicated, [wall.id]);
    const afterReflow = reflowed.objects.find((object) => object.id === "panel-copy-1")!;
    expect(afterReflow.position).toEqual(copy.position);
  });

  it("typed wall length reflow keeps panel on the resized host", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200, dimensions: { widthMm: 800 } });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const before = { ...panel.position };

    const resized = applyWallPlanPatch(withPanel, wall.id, { lengthMm: 1100 });
    const reflowed = reflowPanelsForWalls(resized, [wall.id]);
    const after = reflowed.objects.find((object) => object.id === panel.id)!;
    const attachment = readPanelAttachment(after)!;

    expect(attachment.wallId).toBe(wall.id);
    expect(attachment.alongMm).toBeLessThanOrEqual(1100 - 400);
    expect(after.position.x !== before.x || after.position.z !== before.z).toBe(true);
    expect(resolvePanelPose(reflowed, after, attachment)).not.toBeNull();
  });

  it("rejects non-positive dimensions and clamps width to host wall length", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200, dimensions: { widthMm: 800 } });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;

    const rejected = resizeWallPanel(withPanel, panel.id, {
      widthMm: 0,
      heightMm: 2400,
      depthMm: 24,
    });
    expect(rejected.objects.find((object) => object.id === panel.id)!.dimensions.widthMm).toBe(800);

    const oversized = resizeWallPanel(withPanel, panel.id, {
      widthMm: wallLengthMm(wall) + 500,
      heightMm: 2400,
      depthMm: 24,
    });
    const next = oversized.objects.find((object) => object.id === panel.id)!;
    const attachment = readPanelAttachment(next)!;
    expect(next.dimensions.widthMm).toBeLessThanOrEqual(wallLengthMm(wall));
    expect(resolvePanelPose(oversized, next, attachment)).not.toBeNull();
  });
});
