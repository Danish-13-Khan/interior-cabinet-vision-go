export type CommandItem = {
  id: string;
  label: string;
  hint: string;
  shortcut: string;
  action: () => void;
};

type CommandPaletteProps = {
  query: string;
  items: CommandItem[];
  onQueryChange: (query: string) => void;
  onClose: () => void;
};

export function CommandPalette({
  query,
  items,
  onQueryChange,
  onClose,
}: CommandPaletteProps) {
  return (
    <div className="command-bar-backdrop" onClick={onClose}>
      <div className="command-bar" onClick={(event) => event.stopPropagation()}>
        <div className="command-bar-header">
          <strong>Command Palette</strong>
          <span>Cmd/Ctrl+K</span>
        </div>
        <input
          className="command-bar-input"
          autoFocus
          placeholder="Search commands, tools, and editor actions"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
        />
        <div className="command-bar-list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="command-bar-item"
              onClick={() => {
                item.action();
                onClose();
              }}
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              <kbd>{item.shortcut}</kbd>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
