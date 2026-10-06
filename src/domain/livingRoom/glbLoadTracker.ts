/**
 * Count of GLB models still loading in Model View (their Suspense fallback is
 * on screen). The Showcase tour waits for zero while it warms each room, so a
 * model never finishes loading — and stalls a frame — in the middle of a glide.
 */
let pending = 0;

/** Mark one model as loading; call the returned function once it has loaded or failed. */
export function trackGlbLoad(): () => void {
  pending += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    pending -= 1;
  };
}

export function glbLoadsPending(): number {
  return pending;
}

/** Test helper. */
export function resetGlbLoadTrackerForTests(): void {
  pending = 0;
}
