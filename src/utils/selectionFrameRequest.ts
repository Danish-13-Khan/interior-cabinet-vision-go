const EVENT = "cabinet-designer:frame-selection";

/** Ask whichever view is mounted (plan or 3D) to frame the current selection once it has rendered. */
export function requestSelectionFrame() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => window.dispatchEvent(new Event(EVENT)));
  });
}

export function onSelectionFrameRequest(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
