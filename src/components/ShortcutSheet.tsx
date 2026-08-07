const SHORTCUTS: Array<[string, string]> = [
  ["Cmd/Ctrl+K", "Open command palette"],
  ["?", "Open shortcut help"],
  ["Cmd/Ctrl+Z", "Undo"],
  ["Cmd/Ctrl+Shift+Z", "Redo"],
  ["Cmd/Ctrl+C", "Copy selection"],
  ["Cmd/Ctrl+V", "Paste selection"],
  ["Cmd/Ctrl+D", "Duplicate selection"],
  ["Cmd/Ctrl+A", "Select all items"],
  ["Shift + Drag", "Marquee select in viewport"],
  ["Delete", "Remove selected items"],
];

type ShortcutSheetProps = {
  onClose: () => void;
};

export function ShortcutSheet({ onClose }: ShortcutSheetProps) {
  return (
    <div className="command-bar-backdrop" onClick={onClose}>
      <div className="shortcut-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="command-bar-header">
          <strong>Shortcut Cheat Sheet</strong>
          <span>Press ? to toggle</span>
        </div>
        <div className="shortcut-grid">
          {SHORTCUTS.map(([shortcut, description]) => (
            <div key={shortcut} className="shortcut-row">
              <kbd>{shortcut}</kbd>
              <span>{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
