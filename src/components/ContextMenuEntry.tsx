import { useRef, type ReactNode } from "react";
import { placeContextSubmenu } from "../utils/contextMenuPlacement";
import type { ContextMenuItem } from "./ContextMenu";

type Props = {
  item: ContextMenuItem;
  onClose: () => void;
  renderItems: (items: ContextMenuItem[]) => ReactNode;
};

function measureSubmenu(node: HTMLElement) {
  const previousDisplay = node.style.display;
  const previousVisibility = node.style.visibility;
  node.style.visibility = "hidden";
  node.style.display = "flex";
  const size = { width: Math.max(node.offsetWidth, 188), height: Math.max(node.scrollHeight, 40) };
  node.style.display = previousDisplay;
  node.style.visibility = previousVisibility;
  return size;
}

export function ContextMenuEntry({ item, onClose, renderItems }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const nested = Boolean(item.children && item.children.length > 0);

  function fitSubmenu() {
    const wrap = wrapRef.current;
    const sub = subRef.current;
    if (!wrap || !sub) return;
    const next = placeContextSubmenu({
      trigger: wrap.getBoundingClientRect(),
      submenu: measureSubmenu(sub),
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
    sub.classList.toggle("is-left", next.side === "left");
    sub.classList.toggle("is-up", next.vertical === "up");
    sub.style.maxHeight = `${next.maxHeight}px`;
    sub.dataset.side = next.side;
    sub.dataset.vertical = next.vertical;
  }

  return (
    <div
      ref={wrapRef}
      className={`context-menu-item-wrap${nested ? " has-submenu" : ""}`}
      onMouseEnter={nested ? fitSubmenu : undefined}
      onFocus={nested ? fitSubmenu : undefined}
    >
      <button
        type="button"
        role="menuitem"
        data-testid={`context-menu-item-${item.id}`}
        aria-haspopup={nested ? "menu" : undefined}
        className={`context-menu-item${item.danger ? " is-danger" : ""}${nested ? " has-submenu" : ""}`}
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled || nested || !item.action) return;
          item.action();
          onClose();
        }}
      >
        <span>{item.label}</span>
        {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
        {nested ? <span className="context-menu-caret" aria-hidden="true">▸</span> : null}
      </button>
      {nested ? (
        <div ref={subRef} className="context-menu context-menu-submenu" role="menu">
          {renderItems(item.children!)}
        </div>
      ) : null}
    </div>
  );
}
