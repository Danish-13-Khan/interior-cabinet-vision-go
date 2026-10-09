import { describe, expect, it } from "vitest";
import { resizeLivingRoomObject } from "./planCommands";
import { anchorResizedObject } from "./objectResizeAnchor";
import { createLivingRoomStarterProject } from "./preset";

const NOW = "2026-10-09T09:00:00.000Z";

describe("anchorResizedObject", () => {
  it("keeps the left edge of an unrotated object when the width grows with a min anchor", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const object = project.objects.find((item) => item.rotation.y === 0 && item.kind !== "cabinet") ?? project.objects[0]!;
    const before = object.dimensions;
    const wider = resizeLivingRoomObject(project, object.id, { ...before, widthMm: before.widthMm + 400 });
    const kept = anchorResizedObject(wider, object.id, before, { x: "min" });
    const moved = kept.objects.find((item) => item.id === object.id)!;
    const yaw = (object.rotation.y * Math.PI) / 180;
    const leftBefore = object.position.x - Math.cos(yaw) * before.widthMm / 2;
    const leftAfter = moved.position.x - Math.cos(yaw) * moved.dimensions.widthMm / 2;
    expect(leftAfter).toBeCloseTo(leftBefore, 0);
    expect(anchorResizedObject(wider, object.id, before, { x: "centre" })).toBe(wider);
    expect(anchorResizedObject(wider, object.id, before, undefined)).toBe(wider);
  });
});
