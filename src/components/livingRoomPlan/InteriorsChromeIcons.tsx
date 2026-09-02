import type { ReactNode } from "react";

type IconName = "undo" | "redo" | "check";

const PATHS: Record<IconName, ReactNode> = {
  undo: <><path d="m9 7-5 5 5 5" /><path d="M5 12h8.5a6 6 0 0 1 6 6" /></>,
  redo: <><path d="m15 7 5 5-5 5" /><path d="M19 12h-8.5a6 6 0 0 0-6 6" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
};

export function InteriorsChromeIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
