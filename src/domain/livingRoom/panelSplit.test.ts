import { describe, expect, it } from "vitest";
import { deletePlanWall, splitPlanWallResult, wallLengthMm } from "../interiorProject";
import { addWallPanel } from "./panelCommands";
import {
  panelHostWallIds,
  removePanelsOnWall,
  roomWallIds,
} from "./panelLifecycle";
import { remapPanelsAfterWallSplit } from "./panelSplit";
import { readPanelAttachment, resolvePanelPose } from "./panelAttachment";
import { createLivingRoomStarterProject } from "./preset";

describe("wall panel split and host deletion", () => {
  it("wall split remaps panels onto the correct new segment", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const length = wallLengthMm(wall);
    const withPanels = addWallPanel(
      addWallPanel(project, wall.id, { alongMm: length * 0.25, dimensions: { widthMm: 400 } }),
      wall.id,
      { alongMm: length * 0.75, dimensions: { widthMm: 400 } },
    );
    const panels = withPanels.objects.filter((object) => object.category === "wall-panel");
    const split = splitPlanWallResult(withPanels, wall.id, length / 2);
    const remapped = remapPanelsAfterWallSplit(
      split.project,
      wall.id,
      split.firstWallId,
      split.secondWallId,
    );

    expect(remapped.walls.some((item) => item.id === wall.id)).toBe(false);
    const hostIds = panels.map((panel) => {
      const next = remapped.objects.find((object) => object.id === panel.id)!;
      const attachment = readPanelAttachment(next)!;
      expect([split.firstWallId, split.secondWallId]).toContain(attachment.wallId);
      expect(remapped.walls.some((item) => item.id === attachment.wallId)).toBe(true);
      expect(resolvePanelPose(remapped, next, attachment)).not.toBeNull();
      return attachment.wallId;
    });
    expect(new Set(hostIds).size).toBe(2);
  });

  it("split through a wide panel keeps a resolvable attachment", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const length = wallLengthMm(wall);
    const withPanel = addWallPanel(project, wall.id, {
      alongMm: length / 2,
      dimensions: { widthMm: 1600 },
    });
    const panel = withPanel.objects.find((object) => object.category === "wall-panel")!;
    const split = splitPlanWallResult(withPanel, wall.id, length / 2);
    const remapped = remapPanelsAfterWallSplit(
      split.project,
      wall.id,
      split.firstWallId,
      split.secondWallId,
    );
    const next = remapped.objects.find((object) => object.id === panel.id)!;
    const attachment = readPanelAttachment(next)!;
    const host = remapped.walls.find((item) => item.id === attachment.wallId)!;
    expect(next.dimensions.widthMm).toBeLessThanOrEqual(wallLengthMm(host));
    expect(resolvePanelPose(remapped, next, attachment)).not.toBeNull();
  });

  it("deleting a host wall removes attached panels", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200 });
    expect(withPanel.objects.some((object) => object.category === "wall-panel")).toBe(true);
    const deleted = deletePlanWall(withPanel, wall.id);
    expect(deleted.walls.some((item) => item.id === wall.id)).toBe(false);
    const cleaned = removePanelsOnWall(deleted, wall.id);
    expect(cleaned.objects.some((object) => object.category === "wall-panel")).toBe(false);
  });

  it("room wall ids include every room wall even when panels exist", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const withPanel = addWallPanel(project, wall.id, { alongMm: 1200 });
    const hosts = panelHostWallIds(withPanel, withPanel.activeRoomId);
    const rooms = roomWallIds(withPanel, withPanel.activeRoomId);
    expect(hosts).toEqual([wall.id]);
    expect(rooms.length).toBeGreaterThan(hosts.length);
  });
});
