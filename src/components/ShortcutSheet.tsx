import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  bindingFromKeyboardEvent,
  findShortcutConflicts,
  formatShortcutBinding,
  SHORTCUT_ACTION_LABELS,
  SHORTCUT_FIXED_REFERENCES,
  SHORTCUT_GROUP_LABELS,
  shortcutActionsInGroup,
  type ShortcutActionId,
  type ShortcutBinding,
  type ShortcutGroupId,
  type ShortcutMap,
} from "../domain/desktopUx";

type ShortcutSheetProps = {
  shortcutMap: ShortcutMap;
  onClose: () => void;
  onChangeBinding: (actionId: ShortcutActionId, binding: ShortcutBinding) => void;
  onReset: () => void;
};

const GROUP_ORDER: ShortcutGroupId[] = ["editing", "plan", "model", "views", "tools"];

export function ShortcutSheet({
  shortcutMap,
  onClose,
  onChangeBinding,
  onReset,
}: ShortcutSheetProps) {
  const [capturingId, setCapturingId] = useState<ShortcutActionId | null>(null);
  const [conflictMessage, setConflictMessage] = useState("");

  function captureBinding(actionId: ShortcutActionId, event: ReactKeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Escape") {
      setCapturingId(null);
      return;
    }
    const next = bindingFromKeyboardEvent(event);
    if (next.key === "Shift" || next.key === "Meta" || next.key === "Control" || next.key === "Alt") {
      return;
    }
    const conflicts = findShortcutConflicts(shortcutMap, actionId, next);
    if (conflicts.length > 0) {
      setConflictMessage(
        `Conflicts with ${conflicts.map((id) => SHORTCUT_ACTION_LABELS[id]).join(", ")}`,
      );
      return;
    }
    onChangeBinding(actionId, next);
    setCapturingId(null);
    setConflictMessage("");
  }

  return (
    <div className="shortcut-sheet-backdrop" onClick={onClose} data-testid="shortcut-sheet-backdrop">
      <div
        className="shortcut-sheet shortcut-sheet-studio"
        data-testid="shortcut-sheet"
        role="dialog"
        aria-labelledby="shortcut-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shortcut-sheet-header">
          <div>
            <p className="shortcut-sheet-eyebrow">Interiors · drafting studio</p>
            <strong id="shortcut-sheet-title">Keyboard Shortcuts</strong>
          </div>
          <span>Select a command, then press a new key combination · ? opens this panel</span>
        </header>
        {conflictMessage ? <p className="shortcut-conflict">{conflictMessage}</p> : null}
        <div className="shortcut-sheet-body">
          {GROUP_ORDER.map((group) => {
            const actions = shortcutActionsInGroup(group);
            const fixed = SHORTCUT_FIXED_REFERENCES.filter((item) => item.group === group);
            if (actions.length === 0 && fixed.length === 0) return null;
            return (
              <section key={group} className="shortcut-group" aria-label={SHORTCUT_GROUP_LABELS[group]}>
                <h3 className="shortcut-group-title">{SHORTCUT_GROUP_LABELS[group]}</h3>
                <div className="shortcut-group-list">
                  {actions.map((actionId) => {
                    const binding = shortcutMap[actionId];
                    const isCapturing = capturingId === actionId;
                    return (
                      <button
                        key={actionId}
                        type="button"
                        className={`shortcut-row${isCapturing ? " is-capturing" : ""}`}
                        data-testid={`shortcut-row-${actionId}`}
                        onClick={() => {
                          setCapturingId(actionId);
                          setConflictMessage("");
                        }}
                        onKeyDown={(event) => {
                          if (isCapturing) captureBinding(actionId, event);
                        }}
                      >
                        <kbd>{isCapturing ? "Press keys…" : formatShortcutBinding(binding)}</kbd>
                        <span>{SHORTCUT_ACTION_LABELS[actionId]}</span>
                      </button>
                    );
                  })}
                  {fixed.map((item) => (
                    <div
                      key={item.id}
                      className="shortcut-row is-fixed"
                      data-testid={`shortcut-fixed-${item.id}`}
                    >
                      <kbd>{item.keys}</kbd>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <footer className="shortcut-sheet-footer">
          <button type="button" className="shortcut-sheet-btn" data-testid="shortcut-reset" onClick={onReset}>
            Reset defaults
          </button>
          <button type="button" className="shortcut-sheet-btn is-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
