import type { Scene } from "three";

/** The mounted 3D model view publishes its scene here so panels outside the Canvas can export it. */
let current: Scene | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function registerModelViewScene(scene: Scene): () => void {
  current = scene;
  emit();
  return () => {
    if (current !== scene) return;
    current = null;
    emit();
  };
}

export function getModelViewScene(): Scene | null {
  return current;
}

export function subscribeModelViewScene(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
