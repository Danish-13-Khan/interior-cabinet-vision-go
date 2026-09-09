import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ModelViewAdvancedCameraPopoverProps = {
  openLabel?: string;
  children: ReactNode;
};

/** FOV, height, quality and other advanced camera options (Step 5). */
export function ModelViewAdvancedCameraPopover({
  openLabel = "View settings",
  children,
}: ModelViewAdvancedCameraPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lr-model-advanced" ref={rootRef} data-testid="model-view-settings">
      <button
        type="button"
        className={open ? "is-active" : ""}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        title="FOV, camera height, quality and selection rotate"
        onClick={() => setOpen((value) => !value)}
      >
        {openLabel}
      </button>
      {open ? (
        <div className="lr-model-advanced-panel" role="dialog" id={panelId} aria-label="View settings">
          {children}
        </div>
      ) : null}
    </div>
  );
}
