import { useEffect, useRef, useState } from "react";

export const STUDIO_PANE_MIN = 160;
/** Below this the inspector's W/H/D fields and finish cards truncate. */
export const STUDIO_INSPECTOR_MIN = 300;
export const STUDIO_PANE_MAX = 720;
const CANVAS_MIN = 280;

export type StudioPaneId = "catalog" | "inspector";

/** Drag widths stay inside the viewport so the canvas keeps a minimum strip. */
export function studioPaneMax(hostWidth: number, otherWidth: number) {
  const room = hostWidth - otherWidth - CANVAS_MIN;
  return Math.max(STUDIO_PANE_MIN, Math.min(STUDIO_PANE_MAX, Math.round(room)));
}

/** A stored width that fits the current host: never under the pane minimum, never over the canvas-safe max. */
export function studioPaneWidth(stored: number, min: number, max: number) {
  return Math.round(Math.max(STUDIO_PANE_MIN, Math.min(max, Math.max(min, stored))));
}

export function useStudioPanes(args: {
  catalogWidth: number;
  inspectorWidth: number;
  onCatalogWidth: (width: number) => void;
  onInspectorWidth: (width: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState(1280);
  const [maximized, setMaximized] = useState<StudioPaneId | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setHost(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function toggle(id: StudioPaneId) {
    setMaximized((current) => (current === id ? null : id));
  }

  const catalogMax = studioPaneMax(host, args.inspectorWidth);
  const inspectorMax = studioPaneMax(host, args.catalogWidth);

  return {
    ref,
    maximized,
    catalogMax,
    inspectorMax,
    catalogWidth: studioPaneWidth(args.catalogWidth, STUDIO_PANE_MIN, catalogMax),
    inspectorWidth: studioPaneWidth(args.inspectorWidth, STUDIO_INSPECTOR_MIN, inspectorMax),
    onCatalogWidth: args.onCatalogWidth,
    onInspectorWidth: args.onInspectorWidth,
    toggle,
  };
}
