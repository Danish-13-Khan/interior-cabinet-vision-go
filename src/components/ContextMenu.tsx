import { useEffect, useRef } from "react";
import { ContextMenuEntry } from "./ContextMenuEntry";

export type ContextMenuItem = {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  action?: () => void;
};

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  testId?: string;
};

export function ContextMenu({ x, y, items, onClose, testId }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const node = menuRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    node.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
    node.style.top = `${Math.max(8, Math.min(y, maxY))}px`;
  }, [x, y, items]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      data-testid={testId}
      style={{ left: x, top: y }}
    >
      <ContextMenuItems items={items} onClose={onClose} />
    </div>
  );
}

function ContextMenuItems({
  items,
  onClose,
}: {
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  return items.map((item) =>
    item.separator ? (
      <div key={item.id} className="context-menu-separator" role="separator" />
    ) : (
      <ContextMenuEntry
        key={item.id}
        item={item}
        onClose={onClose}
        renderItems={(children) => <ContextMenuItems items={children} onClose={onClose} />}
      />
    ),
  );
}
