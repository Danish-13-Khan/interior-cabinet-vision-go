import { useState } from "react";
import {
  bindingFromKeyboardEvent,
  findShortcutConflicts,
  formatShortcutBinding,
  SHORTCUT_ACTION_LABELS,
  type ShortcutActionId,
  type ShortcutBinding,
  type ShortcutMap,
} from "../domain/desktopUx";

type ShortcutSheetProps = {
  shortcutMap: ShortcutMap;
  onClose: () => void;
  onChangeBinding: (actionId: ShortcutActionId, binding: ShortcutBinding) => void;
  onReset: () => void;
};

export function ShortcutSheet({
  shortcutMap,
  onClose,
  onChangeBinding,
  onReset,
}: ShortcutSheetProps) {
  const [capturingId, setCapturingId] = useState<ShortcutActionId | null>(null);
  const [conflictMessage, setConflictMessage] = useState("");

  const actionIds = Object.keys(SHORTCUT_ACTION_LABELS) as ShortcutActionId[];

  return (
    <div className="command-bar-backdrop" onClick={onClose}>
      <div
        className="shortcut-sheet shortcut-sheet-configurable"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-bar-header">
          <strong>Keyboard Shortcuts</strong>
          <span>Click a row, then press a new key combo</span>
        </div>
        {conflictMessage ? (
          <p className="shortcut-conflict">{conflictMessage}</p>
        ) : null}
        <div className="shortcut-grid">
          {actionIds.map((actionId) => {
            const binding = shortcutMap[actionId];
            const isCapturing = capturingId === actionId;
            return (
              <button
                key={actionId}
                type="button"
                className={`shortcut-row shortcut-row-button ${isCapturing ? "is-capturing" : ""}`}
                onClick={() => {
                  setCapturingId(actionId);
                  setConflictMessage("");
                }}
                onKeyDown={(event) => {
                  if (!isCapturing) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (event.key === "Escape") {
                    setCapturingId(null);
                    return;
                  }
                  const next = bindingFromKeyboardEvent(event);
                  if (
                    next.key === "Shift" ||
                    next.key === "Meta" ||
                    next.key === "Control" ||
                    next.key === "Alt"
                  ) {
                    return;
                  }
                  const conflicts = findShortcutConflicts(
                    shortcutMap,
                    actionId,
                    next,
                  );
                  if (conflicts.length > 0) {
                    setConflictMessage(
                      `Conflicts with ${conflicts
                        .map((id) => SHORTCUT_ACTION_LABELS[id])
                        .join(", ")}`,
                    );
                    return;
                  }
                  onChangeBinding(actionId, next);
                  setCapturingId(null);
                  setConflictMessage("");
                }}
              >
                <kbd>
                  {isCapturing
                    ? "Press keys…"
                    : formatShortcutBinding(binding)}
                </kbd>
                <span>{SHORTCUT_ACTION_LABELS[actionId]}</span>
              </button>
            );
          })}
        </div>
        <div className="shortcut-sheet-footer">
          <button type="button" className="tb-btn" onClick={onReset}>
            Reset defaults
          </button>
          <button type="button" className="tb-btn tb-accent" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
