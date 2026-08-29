import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

/** Secondary workshop exports — cutlist and full production packet. */
export function MillworkProductionExports({
  triggerDisabled,
  menuBlocked,
  onCutlist,
  onProductionPdf,
}: {
  /** Layout conflicts or export in flight — disable opening the menu. */
  triggerDisabled: boolean;
  /** No millwork yet, layout conflicts, or export in flight — disable menu actions. */
  menuBlocked: boolean;
  onCutlist: () => void;
  onProductionPdf: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 148;
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - menuWidth),
      zIndex: 1000,
      visibility: "visible",
    });
  }, []);

  useEffect(() => {
    if (triggerDisabled) setOpen(false);
  }, [triggerDisabled]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onLayout = () => updatePosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerTitle = triggerDisabled
    ? "Resolve blocking layout conflicts before exporting"
    : menuBlocked
      ? "Add millwork in Plan before exporting production files"
      : "Cutlist CSV and production packet PDF from the cabinet adapter";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="lr-millwork-advanced-trigger"
        disabled={triggerDisabled}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        title={triggerTitle}
      >
        Production
      </button>
      {open
        ? createPortal(
            <div ref={menuRef} id={menuId} role="menu" className="lr-millwork-advanced-menu" style={menuStyle}>
              <button
                type="button"
                role="menuitem"
                disabled={menuBlocked}
                onClick={() => {
                  onCutlist();
                  setOpen(false);
                }}
                title="Production cutlist CSV — board parts and construction details"
              >
                Cutlist CSV
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={menuBlocked}
                onClick={() => {
                  onProductionPdf();
                  setOpen(false);
                }}
                title="Production packet PDF — cabinet marks, technical sheets, cutlist, and costing"
              >
                Production PDF
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
