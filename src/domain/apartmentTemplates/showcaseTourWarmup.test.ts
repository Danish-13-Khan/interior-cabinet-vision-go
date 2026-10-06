import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { instantiateApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseTourStops } from "./showcaseTour";
import { SHOWCASE_TOUR_TIMING, ShowcaseTourController } from "./showcaseTourController";
import { onShowcaseCameraJump, resetShowcaseCameraJumpForTests, type ShowcaseJumpTarget } from "./showcaseJump";
import { ShowcaseTourSession, type ShowcaseTourState } from "./showcaseTourSession";
import { manualScheduler } from "./showcaseTourTestSupport";

const project = instantiateApartmentTemplate("template:apartment:3bhk:v1", { now: COMPOSER_TEST_NOW });
const stops = showcaseTourStops(project);
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Room readiness the test resolves by hand, one room at a time. */
function manualReadiness() {
  const pending: Array<{ resolve: () => void; signal: AbortSignal }> = [];
  return {
    pending,
    wait: (signal: AbortSignal) => new Promise<void>((resolve) => pending.push({ resolve, signal })),
    async readyNext() {
      pending.shift()?.resolve();
      await flush();
    },
    async readyAll() {
      while (pending.length) {
        pending.shift()!.resolve();
        await flush();
      }
    },
  };
}

afterEach(() => resetShowcaseCameraJumpForTests());

describe("Showcase tour warm-up pre-roll (3 BHK)", () => {
  it("warms every room in tour order before the first glide", async () => {
    const clock = manualScheduler();
    const order: string[] = [];
    const ready = manualReadiness();
    const controller = new ShowcaseTourController(stops, {
      warm: (stop, index) => { order.push(`warm:${index}:${stop.roomId}`); return ready.wait(new AbortController().signal); },
      show: (stop, index) => order.push(`show:${index}:${stop.roomId}`),
      end: () => order.push("end"),
    }, clock.scheduler);
    controller.start();
    expect(order).toEqual([`warm:0:${stops[0]!.roomId}`]);
    await ready.readyAll();
    expect(order).toEqual([
      ...stops.map((stop, index) => `warm:${index}:${stop.roomId}`),
      `show:0:${stops[0]!.roomId}`,
    ]);
  });

  it("shows warm-up progress behind the veil, snaps the camera, then hands over to touring", async () => {
    const ready = manualReadiness();
    const states: ShowcaseTourState[] = [];
    const jumps: ShowcaseJumpTarget[] = [];
    onShowcaseCameraJump((_nonce, target) => { if (target) jumps.push(target); });
    const session = new ShowcaseTourSession<string>({
      setTour: (state) => states.push(state),
      setViewPreset: () => undefined,
      setActiveCameraId: () => undefined,
      restoreCameraId: () => null,
      waitForRoomReady: ready.wait,
    }, manualScheduler().scheduler);
    session.start(stops, { activeRoomId: project.activeRoomId, viewPreset: "dollhouse", cameraId: null });
    await ready.readyAll();
    const preparing = states.filter((state) => state.preparing);
    expect(preparing.map((state) => state.roomId)).toEqual(stops.map((stop) => stop.roomId));
    expect(jumps.slice(0, stops.length).every((jump) => jump.glideMs === 1)).toBe(true);
    expect(states.at(-1)).toMatchObject({ active: true, preparing: false, index: 0 });
    expect(jumps.at(-1)).toMatchObject({ cameraId: stops[0]!.cameraId });
    expect(jumps.at(-1)!.glideMs).toBeGreaterThan(1000);
  });

  it("Escape during warm-up stops at once, aborts the readiness wait and never glides", async () => {
    const ready = manualReadiness();
    const states: ShowcaseTourState[] = [];
    const keyboard = new EventTarget();
    const session = new ShowcaseTourSession<string>({
      setTour: (state) => states.push(state),
      setViewPreset: () => undefined,
      setActiveCameraId: () => undefined,
      restoreCameraId: () => null,
      waitForRoomReady: ready.wait,
    }, manualScheduler().scheduler);
    session.start(stops, { activeRoomId: project.activeRoomId, viewPreset: "dollhouse", cameraId: null }, { canvasHost: new EventTarget(), keyboard });
    await ready.readyNext(); // room 0 ready, room 1 warming
    expect(states.at(-1)).toMatchObject({ preparing: true, index: 1 });
    const { signal } = ready.pending[0]!;
    keyboard.dispatchEvent(Object.assign(new Event("keydown"), { key: "Escape" }));
    expect(session.active).toBe(false);
    expect(signal.aborted).toBe(true);
    expect(states.at(-1)).toMatchObject({ active: false, lastStopReason: "escape" });
    await ready.readyAll();
    expect(states.some((state) => state.active && !state.preparing)).toBe(false);
  });
});

describe("Showcase tour warm-up time limit (fake timers)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts the tour after 8 s in total even if a room never reports ready, and aborts that wait", async () => {
    vi.useFakeTimers();
    const shown: number[] = [];
    const signals: AbortSignal[] = [];
    const controller = new ShowcaseTourController(stops, {
      // Room 0 is ready at once; room 1 hangs (a model that never finishes loading).
      warm: (_stop, index, signal) => {
        signals.push(signal);
        return index === 0 ? Promise.resolve() : new Promise<void>(() => undefined);
      },
      show: (_stop, index) => shown.push(index),
      end: () => undefined,
    });
    controller.start();
    await vi.advanceTimersByTimeAsync(SHOWCASE_TOUR_TIMING.warmLimitMs - 1);
    expect(shown).toEqual([]);
    expect(signals).toHaveLength(2);
    expect(signals[1]!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(shown).toEqual([0]);
    expect(signals[1]!.aborted).toBe(true);
    expect(controller.active).toBe(true);
    controller.stop("user");
  });

  it("stopping during warm-up clears the limit timer, and a quick warm-up never waits for it", async () => {
    vi.useFakeTimers();
    const stopped = new ShowcaseTourController(stops, {
      warm: () => new Promise<void>(() => undefined), show: () => undefined, end: () => undefined,
    });
    stopped.start();
    stopped.stop("escape");
    expect(vi.getTimerCount()).toBe(0);
    const shown: number[] = [];
    const quick = new ShowcaseTourController(stops, {
      warm: () => Promise.resolve(), show: (_stop, index) => shown.push(index), end: () => undefined,
    });
    quick.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(shown).toEqual([0]);
    // Only the first stop's glide + hold timer is left; the warm-up limit is gone.
    expect(vi.getTimerCount()).toBe(1);
    quick.stop("user");
  });
});
