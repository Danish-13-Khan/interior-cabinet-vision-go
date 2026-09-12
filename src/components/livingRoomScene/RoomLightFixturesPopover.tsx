import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RoomLightFixturesPanel, type RoomLightFixturesPanelProps } from "./RoomLightFixturesPanel";

export function RoomLightFixturesPopover(props: RoomLightFixturesPanelProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  function dismiss() { setOpen(false); trigger.current?.focus(); }
  return <>
    <button ref={trigger} type="button" aria-expanded={open} onClick={() => setOpen(!open)}>Room lights</button>
    {open && createPortal(<div className="lr-room-light-popover" role="dialog" aria-label="Edit room lights"
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); dismiss(); } }}>
      <button ref={close} type="button" className="lr-room-light-close" onClick={dismiss}>Close lights</button>
      <RoomLightFixturesPanel {...props} />
    </div>, document.body)}
  </>;
}
