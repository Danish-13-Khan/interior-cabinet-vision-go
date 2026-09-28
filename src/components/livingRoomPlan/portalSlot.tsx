import { useSyncExternalStore } from "react";

/**
 * Mount point owned by one chrome region (inspector, canvas header) that other
 * chrome can portal into. While the slot is not mounted the hook returns null
 * and the caller renders inline (or not at all).
 */
export function createPortalSlot(className: string, testId: string) {
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

  function useSlot(): HTMLElement | null {
    return useSyncExternalStore(subscribe, () => slotElement, () => null);
  }

  function Slot() {
    return <section className={className} data-testid={testId} ref={setSlotElement} />;
  }

  return { Slot, useSlot };
}
