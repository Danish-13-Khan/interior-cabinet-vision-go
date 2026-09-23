import { useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";
import "../../styles/auth-notice.css";

type AuthNoticeDialogProps = {
  open: boolean;
  title: string;
  message: string;
  testId?: string;
  onClose: () => void;
};

/** Blocking notice for auth pages. Does not continue the form action. */
export function AuthNoticeDialog({
  open,
  title,
  message,
  testId = "auth-notice",
  onClose,
}: AuthNoticeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(open, dialogRef, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="auth-notice-backdrop"
      data-testid={`${testId}-backdrop`}
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        className="auth-notice"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={`${testId}-message`}
        data-testid={testId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <strong id={`${testId}-title`}>{title}</strong>
        <p id={`${testId}-message`}>{message}</p>
        <button
          type="button"
          className="auth-notice-ok"
          data-dialog-initial-focus
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>,
    document.body,
  );
}
