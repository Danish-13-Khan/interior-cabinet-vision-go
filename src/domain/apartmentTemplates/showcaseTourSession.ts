import type { ShowcaseTourStop } from "./showcaseTour";
import {
  ShowcaseTourController,
  type ShowcaseTourScheduler,
  type ShowcaseTourStopReason,
  type ShowcaseTourTiming,
} from "./showcaseTourController";
import {
  bindShowcaseTourStopInput,
  showcaseTourStopForChange,
  type TourEventTarget,
  type TourWatchState,
} from "./showcaseTourInput";
import { requestShowcaseCameraJump } from "./showcaseJump";

export type ShowcaseTourState = {
  active: boolean;
  /** Warming rooms (hidden behind a veil) before the first glide. */
  preparing: boolean;
  index: number;
  /** Room shown in 3D while touring (view only — the document's active room is untouched). */
  roomId: string | null;
  lastStopReason: ShowcaseTourStopReason | null;
};

export const IDLE_SHOWCASE_TOUR: ShowcaseTourState = {
  active: false, preparing: false, index: -1, roomId: null, lastStopReason: null,
};

/** Model View's local view state; none of it is saved or undoable. */
export type ShowcaseTourSessionView<P extends string> = {
  setTour: (state: ShowcaseTourState) => void;
  setViewPreset: (preset: P) => void;
  setActiveCameraId: (cameraId: string | null) => void;
  /**
   * Camera to land on when the tour ends: the one the user was on before it,
   * when it belongs to the document's active room, else the document's camera.
   */
  restoreCameraId: (cameraBefore: string | null) => string | null;
  /**
   * Resolves once the room on screen has its models loaded and drawn (enables
   * the warm-up pre-roll). Should resolve early once `signal` aborts (tour stopped or warm-up out of time).
   */
  waitForStopReady?: (stop: ShowcaseTourStop, signal: AbortSignal) => Promise<void>;
};

export type ShowcaseTourInputTargets = { canvasHost: TourEventTarget; keyboard: TourEventTarget };

/**
 * One tour run in Model View: steps the camera through the stops via the
 * Showcase jump signal, stops on canvas input / Escape / room switch / preset
 * change, and on `dispose` (leaving 3D) stops without touching unmounted state.
 * Ending puts the view back on the document's room, with the camera and preset
 * the user had before the tour.
 */
export class ShowcaseTourSession<P extends string> {
  private controller: ShowcaseTourController | null = null;
  private unbind: (() => void) | null = null;
  private atStart: TourWatchState | null = null;
  private presetBefore: P | null = null;
  private cameraBefore: string | null = null;
  private disposed = false;

  constructor(
    private readonly view: ShowcaseTourSessionView<P>,
    private readonly scheduler?: ShowcaseTourScheduler,
    private readonly timing?: ShowcaseTourTiming,
  ) {}

  get active(): boolean {
    return this.controller?.active ?? false;
  }

  start(
    stops: readonly ShowcaseTourStop[],
    at: { activeRoomId: string | null; viewPreset: P; cameraId: string | null },
    input?: ShowcaseTourInputTargets,
  ): boolean {
    if (this.active || this.disposed || stops.length === 0) return false;
    this.atStart = { activeRoomId: at.activeRoomId, viewPreset: "perspective" };
    this.presetBefore = at.viewPreset;
    this.cameraBefore = at.cameraId;
    const { waitForStopReady } = this.view;
    this.controller = new ShowcaseTourController(stops, {
      show: (stop, index, glideMs) => {
        if (stop.overview) this.view.setViewPreset("perspective" as P);
        this.view.setTour({ active: true, preparing: false, index, roomId: stop.roomId, lastStopReason: null });
        requestShowcaseCameraJump({ cameraId: stop.cameraId, glideMs });
      },
      end: (reason) => this.end(reason),
      warm: waitForStopReady ? (stop, index, signal) => {
        if (stop.overview) this.view.setViewPreset("perspective" as P);
        this.view.setTour({ active: true, preparing: true, index, roomId: stop.roomId, lastStopReason: null });
        requestShowcaseCameraJump({ cameraId: stop.cameraId, glideMs: 1 });
        return waitForStopReady(stop, signal);
      } : undefined,
    }, this.scheduler, this.timing);
    if (input) {
      this.unbind = bindShowcaseTourStopInput(input.canvasHost, input.keyboard, (reason) => this.stop(reason));
    }
    return this.controller.start();
  }

  /** Feed the document's active room and the view preset after each render. */
  observe(now: TourWatchState): void {
    if (!this.active || !this.atStart) return;
    const reason = showcaseTourStopForChange(this.atStart, now);
    if (reason) this.stop(reason);
  }

  stop(reason: ShowcaseTourStopReason): void {
    this.controller?.stop(reason);
  }

  /** Model View unmounted (left 3D): stop timers and listeners, no view updates. */
  dispose(): void {
    this.disposed = true;
    this.stop("left-3d");
  }

  private end(reason: ShowcaseTourStopReason): void {
    this.unbind?.();
    this.unbind = null;
    if (this.disposed) return;
    this.view.setTour({ ...IDLE_SHOWCASE_TOUR, lastStopReason: reason });
    this.view.setActiveCameraId(this.view.restoreCameraId(this.cameraBefore));
    // A preset the user just picked wins over the one from before the tour.
    if (reason !== "view-change" && this.presetBefore) this.view.setViewPreset(this.presetBefore);
  }
}
