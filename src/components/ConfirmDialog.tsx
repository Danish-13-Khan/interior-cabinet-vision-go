import { useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Danger styling for destructive confirms (delete). */
  danger?: boolean;
  /** Stable id for e2e; buttons use `${testId}-confirm` / `${testId}-cancel`. */
  testId?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-app confirm modal (Escape cancels; focus trapped). Replaces window.confirm for Interiors chrome. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  testId = "confirm-dialog",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(open, dialogRef, onCancel);

  if (!open) return null;

  return createPortal(
    <div
      className="app-confirm-backdrop"
      data-testid={`${testId}-backdrop`}
      onKeyDown={(event) => {
        // Capture React tree shortcuts before they bubble into the plan shell.
        event.stopPropagation();
      }}
    >
      <div
        ref={dialogRef}
        className={`app-confirm-dialog ${danger ? "is-danger" : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={`${testId}-message`}
        data-testid={testId}
        tabIndex={-1}
      >
        <strong id={`${testId}-title`}>{title}</strong>
        <p id={`${testId}-message`} data-testid={`${testId}-message`}>{message}</p>
        <div className="app-confirm-actions">
          <button
            type="button"
            data-testid={`${testId}-cancel`}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "is-danger" : "is-primary"}
            data-testid={`${testId}-confirm`}
            data-dialog-initial-focus
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
