import { useEffect, useMemo, useState } from "react";
import { rankCommands } from "../domain/desktopUx";

export type CommandItem = {
  id: string;
  label: string;
  hint: string;
  shortcut: string;
  category?: string;
  keywords?: string[];
  action: () => void;
};

type CommandPaletteProps = {
  query: string;
  items: CommandItem[];
  recentCommandIds?: string[];
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onRunCommand?: (commandId: string) => void;
};

export function CommandPalette({
  query,
  items,
  recentCommandIds = [],
  onQueryChange,
  onClose,
  onRunCommand,
}: CommandPaletteProps) {
  const ranked = useMemo(
    () => rankCommands(items, query, recentCommandIds),
    [items, query, recentCommandIds],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, ranked.length]);

  function runItem(item: CommandItem) {
    onRunCommand?.(item.id);
    item.action();
    onClose();
  }

  return (
    <div className="command-bar-backdrop" onClick={onClose}>
      <div className="command-bar" onClick={(event) => event.stopPropagation()}>
        <div className="command-bar-header">
          <strong>Command Palette</strong>
          <span>Type to search · ↑↓ Enter · Esc</span>
        </div>
        <input
          className="command-bar-input"
          autoFocus
          placeholder="Search commands, views, exports, and editor actions"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((value) =>
                ranked.length === 0 ? 0 : (value + 1) % ranked.length,
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((value) =>
                ranked.length === 0
                  ? 0
                  : (value - 1 + ranked.length) % ranked.length,
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const item = ranked[activeIndex];
              if (item) runItem(item);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
        />
        <div className="command-bar-list" role="listbox">
          {ranked.length === 0 ? (
            <div className="command-bar-empty">No matching commands</div>
          ) : (
            ranked.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`command-bar-item ${index === activeIndex ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runItem(item)}
              >
                <span>
                  {item.category ? (
                    <em className="command-bar-category">{item.category}</em>
                  ) : null}
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
                <kbd>{item.shortcut}</kbd>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
