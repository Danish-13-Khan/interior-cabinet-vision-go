import type { ShowcaseTourStopReason } from "./showcaseTourController";

type Listener = (event: Event) => void;
export type TourEventTarget = {
  addEventListener: (type: string, listener: Listener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: Listener, options?: boolean | EventListenerOptions) => void;
};

/**
 * Stop the tour on the first sign the user wants the camera back: any pointer
 * press (orbit, pan or click) or wheel (zoom) on the canvas, or Escape. The
 * canvas listeners run in the capture phase and swallow that one event, so the
 * gesture that stops the tour does not also select an object or start a drag.
 */
export function bindShowcaseTourStopInput(
  canvasHost: TourEventTarget,
  keyboard: TourEventTarget,
  stop: (reason: ShowcaseTourStopReason) => void,
): () => void {
  const onCanvas: Listener = (event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    stop("canvas");
  };
  const onKey: Listener = (event) => {
    if ((event as KeyboardEvent).key === "Escape") stop("escape");
  };
  const capture = { capture: true };
  canvasHost.addEventListener("pointerdown", onCanvas, capture);
  canvasHost.addEventListener("wheel", onCanvas, { capture: true, passive: false });
  keyboard.addEventListener("keydown", onKey, capture);
  return () => {
    canvasHost.removeEventListener("pointerdown", onCanvas, capture);
    canvasHost.removeEventListener("wheel", onCanvas, capture);
    keyboard.removeEventListener("keydown", onKey, capture);
  };
}

export type TourWatchState = {
  /** Document active room (the room switcher). */
  activeRoomId: string | null;
  viewPreset: string;
};

/**
 * Stop reason for an outside change while touring: the user switched rooms
 * (the document's active room changed — the tour itself never changes it) or
 * picked another view preset (the tour runs in perspective).
 */
export function showcaseTourStopForChange(
  atStart: TourWatchState,
  now: TourWatchState,
): ShowcaseTourStopReason | null {
  if (now.activeRoomId !== atStart.activeRoomId) return "room-switch";
  if (now.viewPreset !== "perspective") return "view-change";
  return null;
}
