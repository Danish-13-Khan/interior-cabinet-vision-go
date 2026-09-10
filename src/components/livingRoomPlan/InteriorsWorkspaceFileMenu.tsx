import { useEffect, useId, useRef, useState } from "react";

type InteriorsWorkspaceFileMenuProps = {
  disabled?: boolean;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
};

/** Day-one File menu: Open, Save, Export JSON — reuses existing workspace I/O. */
export function InteriorsWorkspaceFileMenu({
  disabled = false,
  onOpen,
  onSave,
  onExport,
}: InteriorsWorkspaceFileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="lr-chrome-file" ref={rootRef} data-testid="interiors-file-menu">
      <button
        type="button"
        className={open ? "is-active" : ""}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        File
      </button>
      {open ? (
        <div className="lr-chrome-file-menu" role="menu" id={menuId}>
          <button type="button" role="menuitem" onClick={() => run(onOpen)}>
            Open…
          </button>
          <button type="button" role="menuitem" onClick={() => run(onSave)}>
            Save
          </button>
          <button type="button" role="menuitem" onClick={() => run(onExport)}>
            Export JSON…
          </button>
        </div>
      ) : null}
    </div>
  );
}
