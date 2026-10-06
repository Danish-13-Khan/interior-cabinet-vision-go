import { easeTowardCameraGoal, type CameraPoseMeters } from "./cameraRigPose";

export type CameraGlideStep = { pose: CameraPoseMeters; settled: boolean };

/**
 * The camera rig's one in-flight ease from a captured pose to a framing goal.
 * Starting a new glide replaces the current one; a settled or cancelled glide
 * yields no further steps.
 */
export type CameraGlide = {
  /** `durationMs` defaults to the standard Model View camera ease. */
  start: (from: CameraPoseMeters, goal: CameraPoseMeters, startMs: number, durationMs?: number) => void;
  cancel: () => void;
  /** Pose for `nowMs`, or null when nothing is gliding. */
  step: (nowMs: number) => CameraGlideStep | null;
};

type Flight = { from: CameraPoseMeters; goal: CameraPoseMeters; startMs: number; durationMs?: number };

export function createCameraGlide(): CameraGlide {
  let flight: Flight | null = null;
  return {
    start: (from, goal, startMs, durationMs) => {
      flight = { from, goal, startMs, durationMs };
    },
    cancel: () => {
      flight = null;
    },
    step: (nowMs) => {
      if (!flight) return null;
      const result = easeTowardCameraGoal(flight.from, flight.goal, nowMs - flight.startMs, flight.durationMs);
      if (result.settled) flight = null;
      return result;
    },
  };
}
