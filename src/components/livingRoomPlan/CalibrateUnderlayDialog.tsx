import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogFocusTrap } from "../../hooks/useDialogFocusTrap";

export type CalibrateAxisChoice = "leave" | "horizontal" | "vertical";

export type CalibrateUnderlayRequest = {
  knownLength: string;
  axis: CalibrateAxisChoice;
  lockAfter: boolean;
};

/**
 * Known-length prompt for the Calibrate tool (roadmap §4.4): the real length of
 * the picture edge A→B, an optional "then make A→B horizontal / vertical", a
 * "lock afterwards" option, and the way into Align to a drawn wall.
 * Test ids keep the `calibrate-known-length` family used by the e2e specs.
 */
export function CalibrateUnderlayDialog({
  open,
  canAlignToWall,
  error = null,
  onClearError,
  onConfirm,
  onAlignToWall,
  onCancel,
  testId = "calibrate-known-length",
}: {
  open: boolean;
  canAlignToWall: boolean;
  error?: string | null;
  onClearError?: () => void;
  onConfirm: (request: CalibrateUnderlayRequest) => void;
  /** Receives the "lock afterwards" choice so the wall pick can honour it. */
  onAlignToWall: (lockAfter: boolean) => void;
  onCancel: () => void;
  testId?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [axis, setAxis] = useState<CalibrateAxisChoice>("leave");
  const [lockAfter, setLockAfter] = useState(false);
  useDialogFocusTrap(open, dialogRef, onCancel);

  useEffect(() => {
    if (open) {
      setValue("");
      setAxis("leave");
      setLockAfter(false);
    }
  }, [open]);

  if (!open) return null;

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm({ knownLength: trimmed, axis, lockAfter });
  }

  const errorId = error ? `${testId}-error` : undefined;
  const choices: Array<{ id: CalibrateAxisChoice; label: string }> = [
    { id: "leave", label: "Leave as is" },
    { id: "horizontal", label: "Horizontal" },
    { id: "vertical", label: "Vertical" },
  ];

  return createPortal(
    <div
      className="app-confirm-backdrop"
      data-testid={`${testId}-backdrop`}
      onKeyDown={(event) => { event.stopPropagation(); }}
    >
      <div
        ref={dialogRef}
        className="app-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={[`${testId}-message`, errorId].filter(Boolean).join(" ")}
        data-testid={testId}
        tabIndex={-1}
      >
        <strong id={`${testId}-title`}>Calibrate underlay</strong>
        <p id={`${testId}-message`} data-testid={`${testId}-message`}>
          How long is the wall between the two points you clicked, in millimetres?
        </p>
        <label className="app-prompt-field">
          <span>Known length (mm)</span>
          <input
            data-testid={`${testId}-input`}
            data-dialog-initial-focus
            value={value}
            inputMode="decimal"
            aria-invalid={Boolean(error)}
            aria-describedby={[`${testId}-message`, errorId].filter(Boolean).join(" ")}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) onClearError?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
          {error ? (
            <p id={`${testId}-error`} className="app-prompt-error" role="alert" data-testid={`${testId}-error`}>{error}</p>
          ) : null}
        </label>
        <div className="app-prompt-choices" role="radiogroup" aria-label="Then make A to B">
          <span>Then make A → B</span>
          {choices.map((choice) => (
            <label key={choice.id}>
              <input
                type="radio"
                name={`${testId}-axis`}
                value={choice.id}
                checked={axis === choice.id}
                data-testid={`${testId}-axis-${choice.id}`}
                onChange={() => setAxis(choice.id)}
              />
              {choice.label}
            </label>
          ))}
        </div>
        <label className="app-prompt-option">
          <input
            type="checkbox"
            checked={lockAfter}
            data-testid={`${testId}-lock`}
            onChange={(event) => setLockAfter(event.target.checked)}
          />
          Lock the underlay afterwards
        </label>
        {canAlignToWall ? (
          <button type="button" className="app-prompt-link" data-testid={`${testId}-align-wall`} onClick={() => onAlignToWall(lockAfter)}>
            Align these two points to a drawn wall instead
          </button>
        ) : null}
        <div className="app-confirm-actions">
          <button type="button" data-testid={`${testId}-cancel`} onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="is-primary"
            data-testid={`${testId}-confirm`}
            disabled={!value.trim()}
            onClick={submit}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
