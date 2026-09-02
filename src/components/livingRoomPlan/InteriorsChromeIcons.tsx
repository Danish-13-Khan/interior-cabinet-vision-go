import type { ReactNode } from "react";
import type { InteriorsChromeTool } from "../../domain/desktopUx";

type IconName = "undo" | "redo" | "check" | InteriorsChromeTool;

const PATHS: Record<IconName, ReactNode> = {
  undo: <><path d="m9 7-5 5 5 5" /><path d="M5 12h8.5a6 6 0 0 1 6 6" /></>,
  redo: <><path d="m15 7 5 5-5 5" /><path d="M19 12h-8.5a6 6 0 0 0-6 6" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  select: <><path d="M4 4l7 16 2-7 7-2Z" /></>,
  room: <path d="M6 6h12v12H6Z" />,
  wall: <path d="M4 12h16" />,
  door: <><path d="M6 20V6a2 2 0 0 1 2-2h8v16" /><path d="M14 12h.01" /></>,
  window: <><path d="M5 5h14v14H5Z" /><path d="M5 12h14M12 5v14" /></>,
  import: <><path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 18h14" /></>,
  cabinet: <><path d="M5 6h14v14H5Z" /><path d="M5 11h14M12 11v9" /></>,
  run: <path d="M5 8h14M5 12h14M5 16h14" />,
  shelf: <path d="M6 7h12M6 12h12M6 17h12" />,
  material: <><path d="M4 8h7v7H4Z" /><path d="M13 8h7v7h-7" /></>,
};

export function InteriorsChromeIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
