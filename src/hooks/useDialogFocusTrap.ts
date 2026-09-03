import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((node) => !node.hasAttribute("disabled") && node.offsetParent !== null);
}

function focusRestoreTarget(testId: string | null | undefined, previous: HTMLElement | null) {
  if (testId) {
    const node = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
    if (node) return node;
  }
  return previous;
}

/** Move focus into a dialog, trap Tab, handle Escape, restore focus on close. */
export function useDialogFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape?: () => void,
  restoreFocusTestId?: string | null,
) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  const restoreIdRef = useRef(restoreFocusTestId);
  restoreIdRef.current = restoreFocusTestId;

  useEffect(() => {
    if (!active) return;
    const root = containerRef.current;
    if (!root) return;
    const dialog: HTMLElement = root;

    const previous = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const capturedTestId = restoreIdRef.current
      ?? previous?.getAttribute("data-testid");
    const frame = window.requestAnimationFrame(() => {
      const items = focusableElements(dialog);
      const preferred = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]");
      (preferred ?? items[0] ?? dialog).focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const escape = onEscapeRef.current;
        if (!escape) return;
        event.preventDefault();
        escape();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableElements(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const activeEl = document.activeElement;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      } else if (activeEl instanceof Node && !dialog.contains(activeEl)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      // Prefer stable test id: openers may remount when the dialog closes.
      window.setTimeout(() => {
        focusRestoreTarget(capturedTestId, previous)?.focus({ preventScroll: true });
      }, 0);
    };
  }, [active, containerRef]);
}
