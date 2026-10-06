import { describe, expect, it } from "vitest";
import { MODEL_VIEW_CAMERA_EASE_MS } from "../../domain/livingRoom/modelViewCameraEase";
import { createCameraGlide } from "./cameraRigGlide";
import type { CameraPoseMeters } from "./cameraRigPose";

const pose = (x: number): CameraPoseMeters => ({
  position: { x, y: 1.6, z: 3 },
  target: { x, y: 1, z: 0 },
  fieldOfViewDegrees: 42,
  orthographic: false,
});
const from = pose(0);
const goal = pose(4);

describe("createCameraGlide", () => {
  it("is idle until started", () => {
    expect(createCameraGlide().step(0)).toBeNull();
  });

  it("eases over the standard duration by default, lands on the goal, then goes idle", () => {
    const glide = createCameraGlide();
    glide.start(from, goal, 1000);
    const mid = glide.step(1000 + MODEL_VIEW_CAMERA_EASE_MS / 2)!;
    expect(mid.settled).toBe(false);
    expect(mid.pose.position.x).toBeGreaterThan(0);
    expect(mid.pose.position.x).toBeLessThan(4);
    const end = glide.step(1000 + MODEL_VIEW_CAMERA_EASE_MS)!;
    expect(end).toEqual({ settled: true, pose: goal });
    expect(glide.step(1000 + MODEL_VIEW_CAMERA_EASE_MS + 16)).toBeNull();
  });

  it("honours a longer showcase glide and a 1 ms snap", () => {
    const glide = createCameraGlide();
    glide.start(from, goal, 0, MODEL_VIEW_CAMERA_EASE_MS * 3);
    expect(glide.step(MODEL_VIEW_CAMERA_EASE_MS)!.settled).toBe(false);
    glide.start(from, goal, 0, 1);
    expect(glide.step(1)).toEqual({ settled: true, pose: goal });
  });

  it("restarting replaces the flight and cancel stops it", () => {
    const glide = createCameraGlide();
    glide.start(from, goal, 0);
    glide.start(goal, from, 100);
    expect(glide.step(100)!.pose.position.x).toBeCloseTo(4);
    glide.cancel();
    expect(glide.step(200)).toBeNull();
  });
});
