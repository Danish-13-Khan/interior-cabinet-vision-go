/** Ephemeral Showcase re-apply signal — not part of undoable render settings. */

type ShowcaseJumpListener = (nonce: number) => void;

let jumpNonce = 0;
const listeners = new Set<ShowcaseJumpListener>();

/** Bump when the user presses Showcase view (even if activeCameraId is unchanged). */
export function requestShowcaseCameraJump(): number {
  jumpNonce += 1;
  for (const listener of listeners) listener(jumpNonce);
  return jumpNonce;
}

/** Model View subscribes so a same-room Showcase after orbit still reframes. */
export function onShowcaseCameraJump(listener: ShowcaseJumpListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper — reset module state between cases. */
export function resetShowcaseCameraJumpForTests(): void {
  jumpNonce = 0;
  listeners.clear();
}
