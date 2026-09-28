import { useSyncExternalStore } from "react";

/**
 * Inspector mount point for Room & plan settings. While the inspector shows
 * room essentials (nothing selected), the draw-room chrome portals its settings
 * here; otherwise they render inline above the canvas.
 */
let slotElement: HTMLElement | null = null;
const listeners = new Set<() => void>();

function setSlotElement(element: HTMLElement | null) {
  if (slotElement === element) return;
  slotElement = element;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInspectorPlanSettingsSlot(): HTMLElement | null {
  return useSyncExternalStore(subscribe, () => slotElement, () => null);
}

export function InspectorPlanSettingsSlot() {
  return <section className="lr-inspector-plan-settings" data-testid="inspector-plan-settings" ref={setSlotElement} />;
}
