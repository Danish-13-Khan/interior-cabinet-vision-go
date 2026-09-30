import { useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { useProjectTabLock } from "../hooks/useProjectTabLock";

const COPY = {
  blocked: {
    title: "Open in another tab",
    message: "This project is being edited in another tab. Changes here would not be saved, so editing is paused. Take over to edit here instead; the other tab saves first and stops.",
  },
  "taken-over": {
    title: "Opened in another tab",
    message: "Another tab took over this project and is saving it now. Editing here is paused so nothing is lost. Reload to take it back.",
  },
} as const;

/**
 * A blocked or taken-over tab cannot save, so it must not accept edits either.
 * The modal traps focus and blocks editor shortcuts; the backdrop blocks the canvas.
 */
export function ProjectTabLockNotice({ projectId }: { projectId: string | null }) {
  const { state, takeOver } = useProjectTabLock(projectId);
  const dialogRef = useRef<HTMLDivElement>(null);
  const paused = state === "blocked" || state === "taken-over";
  useDialogFocusTrap(paused, dialogRef);
  if (!paused) return null;
  const copy = COPY[state];
  return createPortal(
    <div className="app-confirm-backdrop" onKeyDown={(event) => event.stopPropagation()}>
      <div
        ref={dialogRef}
        className="app-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="project-tab-lock-title"
        aria-describedby="project-tab-lock-message"
        data-testid="project-tab-lock"
        tabIndex={-1}
      >
        <strong id="project-tab-lock-title">{copy.title}</strong>
        <p id="project-tab-lock-message">{copy.message}</p>
        <div className="app-confirm-actions">
          {state === "blocked" ? (
            <button type="button" data-testid="project-tab-takeover" onClick={takeOver}>Take over</button>
          ) : (
            <button type="button" data-testid="project-tab-reload" onClick={() => window.location.reload()}>Reload</button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
