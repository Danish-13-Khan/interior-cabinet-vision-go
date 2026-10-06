import { describe, expect, it } from "vitest";
import type { ShowcaseTourStop } from "./showcaseTour";
import {
  SHOWCASE_TOUR_TIMING,
  ShowcaseTourController,
  showcaseTourDurationMs,
  type ShowcaseTourStopReason,
} from "./showcaseTourController";
import { manualScheduler } from "./showcaseTourTestSupport";

const STOPS: ShowcaseTourStop[] = ["a", "b", "c"].map((id) => ({
  roomId: `room-${id}`, roomName: id.toUpperCase(), cameraId: `camera-${id}`,
}));

function harness(stops = STOPS) {
  const clock = manualScheduler();
  const shown: Array<{ roomId: string; index: number; glideMs: number; at: number }> = [];
  const ended: ShowcaseTourStopReason[] = [];
  const controller = new ShowcaseTourController(stops, {
    show: (stop, index, glideMs) => shown.push({ roomId: stop.roomId, index, glideMs, at: clock.now() }),
    end: (reason) => ended.push(reason),
  }, clock.scheduler);
  return { clock, shown, ended, controller };
}

describe("ShowcaseTourController", () => {
  it("shows each stop once, a glide plus a hold apart, then finishes", () => {
    const { clock, shown, ended, controller } = harness();
    const step = SHOWCASE_TOUR_TIMING.glideMs + SHOWCASE_TOUR_TIMING.holdMs;
    expect(controller.start()).toBe(true);
    expect(controller.start()).toBe(false);
    clock.advance(showcaseTourDurationMs(STOPS.length));
    expect(shown.map((entry) => entry.roomId)).toEqual(["room-a", "room-b", "room-c"]);
    expect(shown.map((entry) => entry.at)).toEqual([0, step, 2 * step]);
    expect(shown.every((entry) => entry.glideMs === SHOWCASE_TOUR_TIMING.glideMs)).toBe(true);
    expect(ended).toEqual(["finished"]);
    expect(controller.active).toBe(false);
    expect(clock.pending()).toBe(0);
  });

  it("stops immediately, once, and cancels the pending move", () => {
    const { clock, shown, ended, controller } = harness();
    controller.start();
    clock.advance(SHOWCASE_TOUR_TIMING.glideMs / 2);
    controller.stop("escape");
    controller.stop("canvas");
    expect(ended).toEqual(["escape"]);
    expect(clock.pending()).toBe(0);
    clock.advance(showcaseTourDurationMs(STOPS.length));
    expect(shown).toHaveLength(1);
  });

  it("does nothing without stops and can run again after stopping", () => {
    expect(harness([]).controller.start()).toBe(false);
    const { clock, shown, controller } = harness();
    controller.start();
    controller.stop("user");
    expect(controller.start()).toBe(true);
    clock.advance(10);
    expect(shown.map((entry) => entry.index)).toEqual([0, 0]);
  });
});
