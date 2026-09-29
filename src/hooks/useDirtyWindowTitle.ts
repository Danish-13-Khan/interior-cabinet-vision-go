import { useEffect } from "react";
import { isTauriRuntime } from "../platform/desktopFiles";

export function dirtyWindowTitle(dirty: boolean, projectName: string): string {
  const base = projectName.trim() || "Interior Cabinet Designer";
  return dirty ? `${base} •` : base;
}

/** The window title carries a bullet while the open project has unsaved edits. */
export function useDirtyWindowTitle(dirty: boolean, projectName: string) {
  useEffect(() => {
    const title = dirtyWindowTitle(dirty, projectName);
    if (typeof document !== "undefined") document.title = title;
    if (!isTauriRuntime()) return;
    void import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => getCurrentWindow().setTitle(title))
      .catch(() => undefined);
  }, [dirty, projectName]);
}
