import { PLAN_VIEW_ZOOM_STEP } from "./planViewTransform";

/** Plain wheel-event fields (DOM `WheelEvent` satisfies this shape). */
export type PlanWheelInput = {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  /** Legacy Chromium/WebKit field; multiples of 120 indicate a notched mouse wheel. */
  wheelDeltaY?: number;
};

export type PlanWheelGesture =
  | { kind: "zoom"; factor: number }
  | { kind: "pan"; dxPx: number; dyPx: number };

const LINE_PX = 16;
const PAGE_PX = 400;
const PINCH_ZOOM_RATE = 0.01;

function toPixels(delta: number, deltaMode: number): number {
  if (deltaMode === 1) return delta * LINE_PX;
  if (deltaMode === 2) return delta * PAGE_PX;
  return delta;
}

/** Notched mouse wheels report line deltas or ±120 legacy steps with no horizontal motion. */
export function isNotchedMouseWheel(input: PlanWheelInput): boolean {
  if (input.deltaX !== 0) return false;
  if (input.deltaMode !== 0) return true;
  const legacy = input.wheelDeltaY;
  return typeof legacy === "number" && legacy !== 0 && legacy % 120 === 0;
}

/**
 * Standard 2D-editor wheel mapping:
 * - Ctrl/⌘ + wheel or trackpad pinch (browser sets ctrlKey) → zoom at cursor
 * - Notched mouse wheel → zoom at cursor
 * - Shift + wheel → horizontal pan
 * - Trackpad two-finger scroll → free pan
 */
export function classifyPlanWheel(input: PlanWheelInput): PlanWheelGesture {
  const dy = toPixels(input.deltaY, input.deltaMode);
  const dx = toPixels(input.deltaX, input.deltaMode);
  if (input.ctrlKey || input.metaKey) {
    const factor = input.deltaMode === 0
      ? Math.exp(-dy * PINCH_ZOOM_RATE)
      : (dy < 0 ? PLAN_VIEW_ZOOM_STEP : 1 / PLAN_VIEW_ZOOM_STEP);
    return { kind: "zoom", factor };
  }
  if (input.shiftKey) {
    return { kind: "pan", dxPx: -(dx !== 0 ? dx : dy), dyPx: 0 };
  }
  if (isNotchedMouseWheel(input)) {
    if (dy === 0) return { kind: "zoom", factor: 1 };
    return { kind: "zoom", factor: dy < 0 ? PLAN_VIEW_ZOOM_STEP : 1 / PLAN_VIEW_ZOOM_STEP };
  }
  return { kind: "pan", dxPx: -dx || 0, dyPx: -dy || 0 };
}
