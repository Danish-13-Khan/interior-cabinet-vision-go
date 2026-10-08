import { useSyncExternalStore } from "react";

/**
 * True while a native modal `<dialog>` (opened with `showModal()`) is up. The
 * modal backdrop covers the whole workspace, so the 2D plan and 3D view can
 * hold their last frame instead of redrawing behind it on every edit made in
 * the dialog (Project tools rates, client fields).
 *
 * Only native modals count: the plan's own aria-modal dialogs (calibrate, DWG
 * and PDF import) sit beside a plan that must stay live.
 */
function readCovered() {
  if (typeof document === "undefined") return false;
  for (const dialog of document.querySelectorAll("dialog[open]")) {
    if (dialog.matches(":modal")) return true;
  }
  return false;
}

let covered = false;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function refresh() {
  const next = readCovered();
  if (next === covered) return;
  covered = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!observer && typeof MutationObserver !== "undefined") {
    covered = readCovered();
    observer = new MutationObserver(refresh);
    // `open` flips on showModal()/close(); childList catches a dialog unmounting while open.
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && observer) {
      observer.disconnect();
      observer = null;
    }
  };
}

export function useViewportCovered() {
  return useSyncExternalStore(subscribe, () => covered, () => false);
}
