import type { ShowcaseTourStop } from "./showcaseTour";

/**
 * Camera glide into a room, then a hold on its showcase view. The warm-up
 * pre-roll gets at most `warmLimitMs` in total; after that the tour starts
 * anyway, so one slow model can never hold it back.
 */
export const SHOWCASE_TOUR_TIMING = { glideMs: 1500, holdMs: 2300, warmLimitMs: 8000 } as const;
export type ShowcaseTourTiming = { glideMs: number; holdMs: number; warmLimitMs?: number };

export type ShowcaseTourStopReason =
  | "finished" | "escape" | "canvas" | "room-switch" | "left-3d" | "view-change" | "user";

export type TourTimerHandle = unknown;
export type ShowcaseTourScheduler = {
  setTimeout: (callback: () => void, ms: number) => TourTimerHandle;
  clearTimeout: (handle: TourTimerHandle) => void;
};

/**
 * What the tour drives. Only view state: the room shown in 3D and the camera
 * (through the Showcase jump signal). It is never handed the document, so a
 * tour cannot add undo steps or mark the project dirty.
 */
export type ShowcaseTourView = {
  show: (stop: ShowcaseTourStop, index: number, glideMs: number) => void;
  end: (reason: ShowcaseTourStopReason) => void;
  /**
   * Optional pre-roll before the first glide: show the room (hidden from the
   * user) and resolve once its models are loaded and drawn, so first-visit
   * work — model parsing, geometry, shader compiles — never lands mid-glide.
   * `signal` aborts when the tour stops or the warm-up runs out of time.
   */
  warm?: (stop: ShowcaseTourStop, index: number, signal: AbortSignal) => Promise<void>;
};

const browserScheduler: ShowcaseTourScheduler = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Warms every stop (if the view can), then steps through them on timers: one
 * view update per stop, the camera rig interpolates in between (no React work
 * per frame). `stop` is idempotent and immediate; the last stop's hold ends
 * the tour with "finished".
 */
export class ShowcaseTourController {
  private index = -1;
  private timer: TourTimerHandle | null = null;
  private warmTimer: TourTimerHandle | null = null;
  private warmAbort: AbortController | null = null;
  private running = false;
  private run = 0;

  constructor(
    private readonly stops: readonly ShowcaseTourStop[],
    private readonly view: ShowcaseTourView,
    private readonly scheduler: ShowcaseTourScheduler = browserScheduler,
    private readonly timing: ShowcaseTourTiming = SHOWCASE_TOUR_TIMING,
  ) {}

  get active(): boolean {
    return this.running;
  }

  get stopIndex(): number {
    return this.index;
  }

  start(): boolean {
    if (this.running || this.stops.length === 0) return false;
    this.running = true;
    const run = ++this.run;
    if (this.view.warm) void this.warmThenTour(run, this.view.warm);
    else this.goTo(0);
    return true;
  }

  stop(reason: ShowcaseTourStopReason): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.timer = null;
    this.endWarmUp();
    this.view.end(reason);
  }

  private async warmThenTour(run: number, warm: NonNullable<ShowcaseTourView["warm"]>): Promise<void> {
    const abort = new AbortController();
    this.warmAbort = abort;
    const outOfTime = new Promise<void>((resolve) => abort.signal.addEventListener("abort", () => resolve()));
    const limitMs = this.timing.warmLimitMs ?? SHOWCASE_TOUR_TIMING.warmLimitMs;
    this.warmTimer = this.scheduler.setTimeout(() => abort.abort(), limitMs);
    const live = () => this.running && this.run === run;
    for (let index = 0; index < this.stops.length && live() && !abort.signal.aborted; index += 1) {
      this.index = index;
      // A failed or slow room only costs its own wait; the overall limit still holds.
      await Promise.race([warm(this.stops[index]!, index, abort.signal).catch(() => undefined), outOfTime]);
    }
    if (!live()) return;
    this.endWarmUp();
    this.goTo(0);
  }

  private endWarmUp(): void {
    if (this.warmTimer !== null) this.scheduler.clearTimeout(this.warmTimer);
    this.warmTimer = null;
    this.warmAbort?.abort();
    this.warmAbort = null;
  }

  private goTo(index: number): void {
    this.index = index;
    this.view.show(this.stops[index]!, index, this.timing.glideMs);
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      if (!this.running) return;
      if (index + 1 < this.stops.length) this.goTo(index + 1);
      else this.stop("finished");
    }, this.timing.glideMs + this.timing.holdMs);
  }
}

/** Total length of a tour over `stopCount` stops. */
export function showcaseTourDurationMs(stopCount: number, timing: ShowcaseTourTiming = SHOWCASE_TOUR_TIMING): number {
  return stopCount * (timing.glideMs + timing.holdMs);
}
