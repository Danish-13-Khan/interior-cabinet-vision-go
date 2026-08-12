import type {
  Phase1BenchmarkDefinition,
  Phase1BenchmarkId,
  Phase1LatencyEnvironment,
  Phase1ScorecardCheckId,
} from "./types";

export const PHASE1_BENCHMARK_NOW = "2026-08-12T18:00:00.000Z";

export const PHASE1_BENCHMARK_DEFINITIONS: readonly Phase1BenchmarkDefinition[] = [
  {
    id: "bench-daylight-sofa",
    name: "Daylight Sofa",
    intent: "Window wall + sofa + coffee table under cool daylight.",
    styleId: "nordic-light",
    cameras: [
      {
        key: "camera-a",
        name: "Eye-level sofa / window",
        position: { x: 1180, y: 1480, z: 3180 },
        target: { x: -200, y: 720, z: 200 },
        fieldOfViewDegrees: 42,
      },
      {
        key: "camera-b",
        name: "Corner establishing",
        position: { x: 2100, y: 1520, z: 3400 },
        target: { x: -400, y: 780, z: -200 },
        fieldOfViewDegrees: 46,
      },
    ],
  },
  {
    id: "bench-millwork-media",
    name: "Millwork Media",
    intent: "Media wall millwork + lounge chair cluster.",
    styleId: "warm-contemporary",
    cameras: [
      {
        key: "camera-a",
        name: "Eye-level millwork",
        position: { x: 40, y: 1460, z: 2100 },
        target: { x: 0, y: 820, z: -1980 },
        fieldOfViewDegrees: 43,
      },
      {
        key: "camera-b",
        name: "Seating three-quarter",
        position: { x: 1680, y: 1480, z: 2860 },
        target: { x: -280, y: 700, z: 80 },
        fieldOfViewDegrees: 41,
      },
    ],
  },
  {
    id: "bench-evening-lamp",
    name: "Evening Lamp",
    intent: "Warm evening recipe with floor lamp + side table detail.",
    styleId: "moody-walnut",
    cameras: [
      {
        key: "camera-a",
        name: "Eye-level seating",
        position: { x: 980, y: 1470, z: 3020 },
        target: { x: -120, y: 690, z: 40 },
        fieldOfViewDegrees: 42,
      },
      {
        key: "camera-b",
        name: "Lamp / side table detail",
        position: { x: 1480, y: 1320, z: 420 },
        target: { x: 2200, y: 900, z: -1100 },
        fieldOfViewDegrees: 40,
      },
    ],
  },
] as const;

export const PHASE1_BENCHMARK_IDS: readonly Phase1BenchmarkId[] =
  PHASE1_BENCHMARK_DEFINITIONS.map((item) => item.id);

/** Locked capture environment from Phase 1 §3.3. */
export const PHASE1_LATENCY_ENVIRONMENT: Phase1LatencyEnvironment = {
  appSurface: "tauri-desktop",
  clientPreviewWidthPx: 1920,
  clientPreviewHeightPx: 1080,
  draftWidthPx: 1280,
  draftHeightPx: 720,
  warmRunsRequired: true,
  discardColdRun: true,
  machineClass: "Apple Silicon laptop, >=16 GB RAM, power plugged in",
  draftCaptureMaxMs: 3000,
  clientPreviewCaptureMaxMs: 8000,
  reportQualities: ["draft", "client-preview"],
};

export const PHASE1_SCORECARD_CHECK_IDS: readonly Phase1ScorecardCheckId[] = [
  "ladder",
  "grounding",
  "window-key",
  "framing",
  "latency",
  "honesty",
  "automation",
  "data-safety",
] as const;

export function getPhase1BenchmarkDefinition(id: Phase1BenchmarkId) {
  const found = PHASE1_BENCHMARK_DEFINITIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown Phase 1 benchmark: ${id}`);
  return found;
}
