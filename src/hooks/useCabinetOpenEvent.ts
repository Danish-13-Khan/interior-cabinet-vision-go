import { useEffect } from "react";
import { isTauriRuntime } from "../platform/desktopFiles";

/** macOS Opened events and a second instance's forwarded path both land here. */
export function useCabinetOpenEvent(onPath: (path: string) => void) {
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let stop = () => {};
    let cancelled = false;
    void (async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");
      const pending = await invoke<string | null>("take_pending_cabinet_path");
      if (!cancelled && pending) onPath(pending);
      const unlisten = await listen<string>("cabinet-open-path", (event) => {
        if (event.payload) onPath(event.payload);
      });
      if (cancelled) unlisten();
      else stop = unlisten;
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      stop();
    };
  }, [onPath]);
}
