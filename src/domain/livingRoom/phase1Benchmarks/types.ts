import type { RenderQuality } from "../../interiorProject";

/** Canonical Phase 1 benchmark room ids from the scorecard doc. */
export type Phase1BenchmarkId =
  | "bench-daylight-sofa"
  | "bench-millwork-media"
  | "bench-evening-lamp";

export type Phase1CameraKey = "camera-a" | "camera-b";

export type Phase1BenchmarkFrameId = `${Phase1BenchmarkId}/${Phase1CameraKey}`;

export type Phase1BenchmarkCameraLock = {
  key: Phase1CameraKey;
  name: string;
  /** Eye-level hero pose in project mm. */
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fieldOfViewDegrees: number;
};

export type Phase1BenchmarkDefinition = {
  id: Phase1BenchmarkId;
  name: string;
  intent: string;
  styleId: "nordic-light" | "warm-contemporary" | "moody-walnut";
  cameras: readonly [Phase1BenchmarkCameraLock, Phase1BenchmarkCameraLock];
};

export type Phase1LatencyEnvironment = {
  appSurface: "tauri-desktop";
  clientPreviewWidthPx: number;
  clientPreviewHeightPx: number;
  draftWidthPx: number;
  draftHeightPx: number;
  warmRunsRequired: true;
  discardColdRun: true;
  machineClass: string;
  draftCaptureMaxMs: number;
  clientPreviewCaptureMaxMs: number;
  reportQualities: readonly RenderQuality[];
};

export type Phase1ScorecardCheckId =
  | "ladder"
  | "grounding"
  | "window-key"
  | "framing"
  | "latency"
  | "honesty"
  | "automation"
  | "data-safety";
