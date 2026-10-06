import { useEffect, useMemo, useState } from "react";
import {
  bootPerfHud,
  readPerfHudOpen,
  setPerfHudOpen,
  subscribePerfHud,
  togglePerfHudOpen,
} from "../domain/performance/perfHudSession";
import { readPerfHudDebugStart, readPerformanceHudAllowedFromBrowser } from "../domain/performance/readPerfHudBrowser";

/** Shared session: the job menu and both 3D canvases read the same open flag. */
export function usePerfHudSession() {
  const allowed = useMemo(() => readPerformanceHudAllowedFromBrowser(), []);
  const debug = useMemo(() => readPerfHudDebugStart(), []);
  bootPerfHud(debug);
  const [open, setOpen] = useState(readPerfHudOpen);

  useEffect(() => subscribePerfHud(setOpen), []);

  return {
    showMenu: allowed,
    checked: open,
    visible: open && (allowed || debug),
    toggle: togglePerfHudOpen,
    close: () => setPerfHudOpen(false),
  };
}
