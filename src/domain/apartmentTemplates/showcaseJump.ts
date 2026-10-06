/** Ephemeral Showcase re-apply signal — not part of undoable render settings. */

/**
 * Explicit camera for a jump (the Showcase tour): Model View applies it to its
 * local camera without checking the current scene, because the room it belongs
 * to is switched in the same render. `glideMs` lengthens the next camera ease.
 */
export type ShowcaseJumpTarget = {
  cameraId: string | null;
  glideMs?: number;
};

type ShowcaseJumpListener = (nonce: number, target?: ShowcaseJumpTarget) => void;

let jumpNonce = 0;
let pendingGlideMs: number | null = null;
const listeners = new Set<ShowcaseJumpListener>();

/**
 * Bump when the user presses Showcase view (even if activeCameraId is unchanged),
 * or when the tour moves to its next stop (with an explicit target).
 */
export function requestShowcaseCameraJump(target?: ShowcaseJumpTarget): number {
  jumpNonce += 1;
  pendingGlideMs = target?.glideMs ?? null;
  for (const listener of listeners) listener(jumpNonce, target);
  return jumpNonce;
}

/** Model View subscribes so a same-room Showcase after orbit still reframes. */
export function onShowcaseCameraJump(listener: ShowcaseJumpListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Consumed by the next camera ease. Does not notify Showcase listeners. */
export function armNextCameraGlideMs(ms: number) {
  pendingGlideMs = ms;
}

/** Camera rig: duration for the ease the last jump started (once), else null for the default ease. */
export function takeShowcaseGlideMs(): number | null {
  const glide = pendingGlideMs;
  pendingGlideMs = null;
  return glide;
}

/** Test helper — reset module state between cases. */
export function resetShowcaseCameraJumpForTests(): void {
  jumpNonce = 0;
  pendingGlideMs = null;
  listeners.clear();
}
