import { useEffect, useId, useRef, useState } from "react";
import type { ProjectSnapshot } from "../../domain/projectSnapshots/types";
import { VersionHistoryMenu } from "./VersionHistoryMenu";
import { VersionPreviewDialog } from "./VersionPreviewDialog";

type InteriorsWorkspaceFileMenuProps = {
  projectId?: string | null;
  disabled?: boolean;
  onProjectTools?: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenShortcuts?: () => void;
  performanceOpen?: boolean;
  onTogglePerformance?: () => void;
};

/** Job menu ▾ next to the job name: project tools plus File actions (open, save, export). */
export function InteriorsWorkspaceFileMenu({
  projectId = null,
  disabled = false,
  onProjectTools,
  onOpen,
  onSave,
  onExport,
  onOpenShortcuts,
  performanceOpen = false,
  onTogglePerformance,
}: InteriorsWorkspaceFileMenuProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ProjectSnapshot | null>(null);
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
          {onTogglePerformance ? (
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={performanceOpen}
              data-testid="interiors-open-performance"
              onClick={() => run(onTogglePerformance)}
            >
              {performanceOpen ? "✓ " : ""}Performance
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={() => run(onOpen)}>
            Open…
          </button>
          <button type="button" role="menuitem" onClick={() => run(onSave)}>
            Save
          </button>
          <VersionHistoryMenu projectId={projectId} onChoose={(snapshot) => run(() => setPreview(snapshot))} />
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
      <VersionPreviewDialog snapshot={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
