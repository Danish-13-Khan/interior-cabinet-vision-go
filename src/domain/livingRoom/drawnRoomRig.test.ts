import { describe, expect, it } from "vitest";
import { drawRoomFromPoints, rectanglePoints } from "../interiorProject";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import { createLivingRoomStarterProject } from "./preset";
import { ensureDrawnRoomReviewRig } from "./drawnRoomRig";

const NOW = "2026-08-31T00:00:00.000Z";

describe("drawn room review rig", () => {
  it("adds cameras and lights when the first room is drawn on a blank plan", () => {
    const blank = applyPlannerStarterTemplate(
      createLivingRoomStarterProject({ now: NOW }),
      "blank-room",
    );
    expect(blank.rooms).toHaveLength(0);
    const drawn = drawRoomFromPoints(blank, {
      kind: "rectangle",
      points: rectanglePoints({ x: 0, z: 0 }, { x: 4000, z: 3000 }),
    });
    const next = ensureDrawnRoomReviewRig(blank, drawn);
    expect(next.cameras.length).toBeGreaterThan(0);
    expect(next.lights.length).toBeGreaterThan(0);
    expect(next.cameras.every((camera) => camera.roomId === next.activeRoomId)).toBe(true);
  });

  it("does not replace an existing review rig", () => {
    const source = createLivingRoomStarterProject({ now: NOW });
    const drawn = drawRoomFromPoints(source, {
      kind: "rectangle",
      points: rectanglePoints({ x: 8000, z: 0 }, { x: 11000, z: 2400 }),
    });
    expect(ensureDrawnRoomReviewRig(source, drawn).cameras).toEqual(drawn.cameras);
  });
});
