import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";

export type PromptDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  label?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Stable id for e2e; input/buttons use `${testId}-input` / `-confirm` / `-cancel`. */
  testId?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/** In-app text prompt (Escape cancels; focus trapped). Replaces window.prompt for Interiors chrome. */
export function PromptDialog({
  open,
  title,
  message,
  label = "Name",
  initialValue = "",
  confirmLabel = "Rename",
  cancelLabel = "Cancel",
  testId = "prompt-dialog",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initialValue);
  useDialogFocusTrap(open, dialogRef, onCancel);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return createPortal(
    <div
      className="app-confirm-backdrop"
      data-testid={`${testId}-backdrop`}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        ref={dialogRef}
        className="app-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={message ? `${testId}-message` : undefined}
        data-testid={testId}
        tabIndex={-1}
      >
        <strong id={`${testId}-title`}>{title}</strong>
        {message ? <p id={`${testId}-message`} data-testid={`${testId}-message`}>{message}</p> : null}
        <label className="app-prompt-field">
          <span>{label}</span>
          <input
            data-testid={`${testId}-input`}
            data-dialog-initial-focus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
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
            className="is-primary"
            data-testid={`${testId}-confirm`}
            disabled={!value.trim()}
            onClick={submit}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
