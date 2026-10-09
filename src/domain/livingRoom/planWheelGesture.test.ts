import { describe, expect, it } from "vitest";
import { classifyPlanWheel, isNotchedMouseWheel, type PlanWheelInput } from "./planWheelGesture";
import { PLAN_VIEW_ZOOM_STEP } from "./planViewTransform";

function wheel(partial: Partial<PlanWheelInput>): PlanWheelInput {
  return { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, metaKey: false, shiftKey: false, ...partial };
}

describe("classifyPlanWheel", () => {
  it("pans freely on trackpad two-finger scroll", () => {
    expect(classifyPlanWheel(wheel({ deltaX: 12, deltaY: -30 }))).toEqual({ kind: "pan", dxPx: -12, dyPx: 30 });
  });

  it("pans vertically on fractional pixel scroll without legacy notch", () => {
    expect(classifyPlanWheel(wheel({ deltaY: 7.5, wheelDeltaY: -22 }))).toEqual({ kind: "pan", dxPx: 0, dyPx: -7.5 });
  });

  it("zooms in on trackpad pinch (ctrlKey) at a smooth rate", () => {
    const gesture = classifyPlanWheel(wheel({ deltaY: -10, ctrlKey: true }));
    expect(gesture.kind).toBe("zoom");
    if (gesture.kind === "zoom") expect(gesture.factor).toBeCloseTo(Math.exp(0.1));
  });

  it("zooms with ⌘ + wheel", () => {
    expect(classifyPlanWheel(wheel({ deltaY: 3, deltaMode: 1, metaKey: true })))
      .toEqual({ kind: "zoom", factor: 1 / PLAN_VIEW_ZOOM_STEP });
  });

  it("zooms by one step for a notched mouse wheel (line mode)", () => {
    expect(classifyPlanWheel(wheel({ deltaY: -3, deltaMode: 1 })))
      .toEqual({ kind: "zoom", factor: PLAN_VIEW_ZOOM_STEP });
  });

  it("zooms by one step for a notched mouse wheel (pixel mode, legacy ±120)", () => {
    expect(classifyPlanWheel(wheel({ deltaY: 100, wheelDeltaY: -120 })))
      .toEqual({ kind: "zoom", factor: 1 / PLAN_VIEW_ZOOM_STEP });
  });

  it("pans horizontally with Shift + wheel", () => {
    expect(classifyPlanWheel(wheel({ deltaY: 3, deltaMode: 1, shiftKey: true })))
      .toEqual({ kind: "pan", dxPx: -48, dyPx: 0 });
  });
});

describe("isNotchedMouseWheel", () => {
  it("treats any horizontal delta as a trackpad", () => {
    expect(isNotchedMouseWheel(wheel({ deltaX: 1, deltaY: 100, wheelDeltaY: -120 }))).toBe(false);
  });
});
