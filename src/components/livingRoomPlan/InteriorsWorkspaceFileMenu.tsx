import { useEffect, useId, useRef, useState } from "react";
import { VersionHistoryMenu } from "./VersionHistoryMenu";

type InteriorsWorkspaceFileMenuProps = {
  disabled?: boolean;
  onProjectTools?: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenShortcuts?: () => void;
};

/** Job menu ▾ next to the job name: project tools plus File actions (open, save, export). */
export function InteriorsWorkspaceFileMenu({
  disabled = false,
  onProjectTools,
  onOpen,
  onSave,
  onExport,
  onOpenShortcuts,
}: InteriorsWorkspaceFileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="lr-chrome-file" ref={rootRef} data-testid="interiors-file-menu">
      <button
        type="button"
        className={`lr-chrome-job-toggle${open ? " is-active" : ""}`}
        aria-label="Job menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="lr-chrome-file-menu" role="menu" id={menuId}>
          {onProjectTools ? (
            <button type="button" role="menuitem" data-testid="interiors-open-project-tools" onClick={() => run(onProjectTools)}>
              Project tools…
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={() => run(onOpen)}>
            Open…
          </button>
          <button type="button" role="menuitem" onClick={() => run(onSave)}>
            Save
          </button>
          <VersionHistoryMenu />
          <button type="button" role="menuitem" onClick={() => run(onExport)}>
            Export JSON…
          </button>
          {onOpenShortcuts ? (
            <button
              type="button"
              role="menuitem"
              data-testid="interiors-open-shortcuts"
              onClick={() => run(onOpenShortcuts)}
            >
              Keyboard shortcuts…
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
