export const GOLDEN_CABINET_RUN_ID = "golden-cabinet-run";
export const GOLDEN_CABINET_RUN_FIXTURE_VERSION = 1;
export const GOLDEN_CABINET_RUN_NOW = "2026-08-31T00:00:00.000Z";
export const GOLDEN_CABINET_RUN_NAME = "Golden Cabinet Run";
export const GOLDEN_RUN_ORIGINAL_WIDTH_MM = 900;
export const GOLDEN_RUN_REVISED_WIDTH_MM = 800;
export const GOLDEN_RUN_REVISED_DOOR_STYLE = "shaker";
export const GOLDEN_RUN_REVISED_FINISH_ID = "wood-walnut";
export const GOLDEN_RUN_WALL_MOUNT_Y_MM = 1400;

export const GOLDEN_RUN_OBJECT_IDS = {
  tall: "golden-run-tall",
  baseA: "golden-run-base-a",
  drawer: "golden-run-drawer",
  baseB: "golden-run-base-b",
  wallA: "golden-run-wall-a",
  wallB: "golden-run-wall-b",
} as const;

export const GOLDEN_RUN_FILLER_IDS = {
  start: "golden-run-filler-start",
  end: "golden-run-filler-end",
} as const;

export const GOLDEN_RUN_COUNTERTOP_CABINET_IDS = [
  GOLDEN_RUN_OBJECT_IDS.baseA,
  GOLDEN_RUN_OBJECT_IDS.drawer,
  GOLDEN_RUN_OBJECT_IDS.baseB,
] as const;

export const GOLDEN_RUN_COUNTERTOP_DEPTH_MM = 585;
export const GOLDEN_RUN_COUNTERTOP_THICKNESS_MM = 28;

export const GOLDEN_RUN_FLOOR_IDS = [
  GOLDEN_RUN_OBJECT_IDS.tall,
  GOLDEN_RUN_OBJECT_IDS.baseA,
  GOLDEN_RUN_OBJECT_IDS.drawer,
  GOLDEN_RUN_OBJECT_IDS.baseB,
] as const;

export const GOLDEN_RUN_JOB = {
  customerName: "Golden Cabinet Run",
  projectNumber: "GCR-001",
  revision: "A",
  notes: "P0-E golden workflow fixture",
} as const;

export const GOLDEN_RUN_ROOM = {
  widthMm: 6000,
  depthMm: 4000,
  heightMm: 2800,
  wallThicknessMm: 120,
} as const;

export const GOLDEN_RUN_STAGES = [
  "open-benchmark",
  "confirm-room",
  "confirm-cabinets",
  "confirm-run",
  "review-3d",
  "revise-width",
  "change-material",
  "assert-3d",
  "assert-quote",
  "assert-cutlist",
  "freeze-quote",
  "create-proposal",
  "save-project",
  "reopen-project",
  "send-engineering",
  "assert-ids",
  "verify-revision",
] as const;

export type GoldenRunStage = (typeof GOLDEN_RUN_STAGES)[number];

export function goldenRunIdFactory(scope: string, key: string) {
  return `golden-run-${scope}-${key}`;
}

export const GOLDEN_RUN_WALL_BACK_ID = goldenRunIdFactory("wall", "back");
export const GOLDEN_RUN_WALL_RIGHT_ID = goldenRunIdFactory("wall", "right");
export const GOLDEN_RUN_CAMERA_ID = goldenRunIdFactory("camera", "hero");
export const GOLDEN_RUN_ROOM_ID = goldenRunIdFactory("room", "main");
