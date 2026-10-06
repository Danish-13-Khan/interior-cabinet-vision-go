import { useEffect, useMemo, useState } from "react";
import {
  bootPerfHud,
  readPerfHudOpen,
  setPerfHudOpen,
  subscribePerfHud,
  togglePerfHudOpen,
} from "../domain/performance/perfHudSession";
import { readPerfHudDebugStart } from "../domain/performance/readPerfHudBrowser";

/** Shared session: the job menu and both 3D canvases read the same open flag. */
export function usePerfHudSession() {
  const debug = useMemo(() => readPerfHudDebugStart(), []);
  bootPerfHud(debug);
  const [open, setOpen] = useState(readPerfHudOpen);

  useEffect(() => subscribePerfHud(setOpen), []);

  return {
    checked: open,
    visible: open,
    toggle: togglePerfHudOpen,
    close: () => setPerfHudOpen(false),
  };
}
