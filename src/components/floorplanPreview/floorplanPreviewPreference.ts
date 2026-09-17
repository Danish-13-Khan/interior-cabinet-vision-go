/**
 * One-shot Preview arm for Model View.
 * request() bumps a generation and notifies subscribers so an already-mounted
 * bridge can switch to Preview (chrome 3D while Model is open).
 */
let preferPreviewOnNextModel = false;
let generation = 0;
const listeners = new Set<() => void>();

export function requestFloorplanPreviewOnModel() {
  preferPreviewOnNextModel = true;
  generation += 1;
  for (const listener of listeners) listener();
}

export function consumeFloorplanPreviewOnModel(): boolean {
  const next = preferPreviewOnNextModel;
  preferPreviewOnNextModel = false;
  return next;
}

export function peekFloorplanPreviewOnModel(): boolean {
  return preferPreviewOnNextModel;
}

export function getFloorplanPreviewRequestGeneration(): number {
  return generation;
}

/** Notify when requestFloorplanPreviewOnModel runs (bridge stays mounted). */
export function subscribeFloorplanPreviewRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
