import { describe, expect, it } from "vitest";
import {
  cameraPoseFingerprint,
  modelViewFramingIntentKey,
  nextUserOwnedCameraPose,
  shouldApplyCameraFramingPose,
  shouldHoldFitFraming,
} from "./modelViewCameraFramingPolicy";

const intent = {
  activeCameraId: "cam-a",
  viewPreset: "perspective" as const,
  fitVersion: 0,
  fitMode: "room" as const,
  cameraHeightMm: undefined as number | undefined,
  fieldOfViewDegrees: undefined as number | undefined,
  composition: "architectural",
  renderMode: "preview",
  projectId: "p",
  roomId: "r",
  cameraFingerprint: "fp",
};

describe("modelViewCameraFramingPolicy", () => {
  it("keeps intent stable across asset/resize-only fingerprints", () => {
    const key = modelViewFramingIntentKey(intent);
    expect(modelViewFramingIntentKey({ ...intent, cameraFingerprint: "fp" })).toBe(key);
    expect(modelViewFramingIntentKey({ ...intent, fitVersion: 1 })).not.toBe(key);
  });

  it("does not reframe while the user owns the orbit pose", () => {
    expect(shouldApplyCameraFramingPose({
      orthoSwitched: false, intentChanged: false, userOwnedPose: true, userNavigating: false,
    })).toBe(false);
    expect(shouldApplyCameraFramingPose({
      orthoSwitched: false, intentChanged: false, userOwnedPose: false, userNavigating: true,
    })).toBe(false);
  });

  it("reframes on preset or projection switches even after orbit", () => {
    expect(shouldApplyCameraFramingPose({
      orthoSwitched: true, intentChanged: false, userOwnedPose: true, userNavigating: true,
    })).toBe(true);
    expect(shouldApplyCameraFramingPose({
      orthoSwitched: false, intentChanged: true, userOwnedPose: true, userNavigating: false,
    })).toBe(true);
  });

  it("clears ownership when framing intent changes", () => {
    expect(nextUserOwnedCameraPose({
      intentChanged: true, userNavigating: true, orbitCancelled: true, wasOwned: true,
    })).toBe(false);
    expect(nextUserOwnedCameraPose({
      intentChanged: false, userNavigating: false, orbitCancelled: true, wasOwned: false,
    })).toBe(true);
  });

  it("holds Fit framing across resize/load until a new camera intent", () => {
    expect(shouldHoldFitFraming({
      applyFitShot: true, intentChanged: true, wasHoldingFit: false,
    })).toBe(true);
    expect(shouldHoldFitFraming({
      applyFitShot: false, intentChanged: false, wasHoldingFit: true,
    })).toBe(true);
    expect(shouldHoldFitFraming({
      applyFitShot: false, intentChanged: true, wasHoldingFit: true,
    })).toBe(false);
  });

  it("fingerprints named camera pose", () => {
    expect(cameraPoseFingerprint({
      id: "a",
      fieldOfViewDegrees: 42,
      position: { x: 1, y: 2, z: 3 },
      target: { x: 0, y: 0, z: 0 },
    })).toContain("a");
  });
});
