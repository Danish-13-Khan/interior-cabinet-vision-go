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

  it("keeps the anchored edge of a 90° rotated object along its own width axis", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const source = project.objects[0]!;
    const rotated = { ...project, objects: project.objects.map((item) => (item.id === source.id ? { ...item, rotation: { ...item.rotation, y: 90 } } : item)) };
    const before = source.dimensions;
    const wider = resizeLivingRoomObject(rotated, source.id, { ...before, widthMm: before.widthMm + 400 });
    const moved = anchorResizedObject(wider, source.id, before, { x: "max" }).objects.find((item) => item.id === source.id)!;
    // Local +X at yaw 90° is plan (cos 90°, −sin 90°) = (0, −1): the right edge sits at z − w/2 and must not move.
    expect(moved.position.x).toBeCloseTo(source.position.x, 0);
    expect(moved.position.z - moved.dimensions.widthMm / 2).toBeCloseTo(source.position.z - before.widthMm / 2, 0);
  });
});
