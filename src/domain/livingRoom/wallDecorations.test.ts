import { describe, expect, it } from "vitest";
import { splitPlanWallResult, wallLengthMm } from "../interiorProject";
import { createLivingRoomObject, LIVING_ROOM_CATALOG } from "./catalog";
import { isWallPanelObject, readPanelAttachment } from "./panelAttachment";
import { reflowPanelsForWalls } from "./panelCommands";
import { removePanelsOnWall } from "./panelLifecycle";
import { remapPanelsAfterWallSplit } from "./panelSplit";
import { createLivingRoomStarterProject } from "./preset";
import { compileLivingRoomObjectNode } from "./sceneAdapters";
import { V1_PRODUCT_SCOPE } from "./v1Scope";
import { addWallDecoration, WALL_DECORATION_PRESETS } from "./wallDecorations";

describe("wall decoration presets (phase 6)", () => {
  const starter = () => createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });

  it("keeps the curated catalog at or under 50", () => {
    expect(LIVING_ROOM_CATALOG.length).toBeLessThanOrEqual(50);
    expect(LIVING_ROOM_CATALOG.length).toBeLessThanOrEqual(V1_PRODUCT_SCOPE.maxCuratedCatalogItems);
  });

  it("leaves an unattached mirror off the panel contract", () => {
    const mirror = createLivingRoomObject("living:wall-mirror", {
      id: "mirror-free",
      roomId: "room",
      position: { x: 0, y: 0, z: 0 },
    });
    expect(isWallPanelObject(mirror)).toBe(false);
    const base = starter();
    expect(addWallDecoration(base, "missing-wall", "mirror")).toBe(base);
    expect(addWallDecoration(base, base.walls[0]!.id, "not-a-preset")).toBe(base);
  });

  it("places every preset on the wall and keeps it through reflow, split, and removal", () => {
    const base = starter();
    const wall = base.walls[0]!;
    const length = wallLengthMm(wall);
    for (const preset of WALL_DECORATION_PRESETS) {
      const next = addWallDecoration(base, wall.id, preset.id);
      const added = next.objects.find((object) => !base.objects.some((item) => item.id === object.id));
      expect(added, preset.id).toBeTruthy();
      expect(added!.catalogItemId).toBe(preset.catalogItemId);
      expect(isWallPanelObject(added!)).toBe(true);
      const attachment = readPanelAttachment(added!)!;
      expect(attachment.wallId).toBe(wall.id);
      const half = added!.dimensions.widthMm / 2;
      expect(attachment.alongMm).toBeGreaterThanOrEqual(half - 1);
      expect(attachment.alongMm).toBeLessThanOrEqual(length - half + 1);
      expect(added!.position.y).toBe(preset.floorOffsetMm);
      expect(compileLivingRoomObjectNode(added!).primitives.length).toBeGreaterThan(0);

      expect(reflowPanelsForWalls(next, [wall.id]).objects.some((object) => object.id === added!.id)).toBe(true);

      const split = splitPlanWallResult(next, wall.id, length / 2);
      const remapped = remapPanelsAfterWallSplit(
        split.project,
        wall.id,
        split.firstWallId,
        split.secondWallId,
      );
      const host = readPanelAttachment(remapped.objects.find((object) => object.id === added!.id)!)?.wallId;
      expect([split.firstWallId, split.secondWallId]).toContain(host);

      expect(removePanelsOnWall(next, wall.id).objects.some((object) => object.id === added!.id)).toBe(false);
    }
  });
});
