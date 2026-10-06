import type { CardCameraPose } from "./cameraPathPose";

let nonce = 0;
let pose: CardCameraPose | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function publishCardCapturePose(next: CardCameraPose | null): number {
  pose = next;
  nonce += 1;
  notify();
  return nonce;
}

export function readCardCapturePose(): { pose: CardCameraPose; nonce: number } | null {
  if (!import.meta.env.DEV || !pose) return null;
  return { pose, nonce };
}

export function subscribeCardCaptureRig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function cardCaptureRigRevision(): number {
  return nonce;
}

export function resetCardCapturePoseForTests(): void {
  pose = null;
  nonce = 0;
  notify();
}
