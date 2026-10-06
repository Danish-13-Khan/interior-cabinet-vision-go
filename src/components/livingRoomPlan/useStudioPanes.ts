import { useEffect, useRef, useState } from "react";

export const STUDIO_PANE_MIN = 160;
export const STUDIO_PANE_MAX = 720;
const CANVAS_MIN = 280;

export type StudioPaneId = "catalog" | "inspector";

/** Drag widths stay inside the viewport so the canvas keeps a minimum strip. */
export function studioPaneMax(hostWidth: number, otherWidth: number) {
  const room = hostWidth - otherWidth - CANVAS_MIN;
  return Math.max(STUDIO_PANE_MIN, Math.min(STUDIO_PANE_MAX, Math.round(room)));
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

  return {
    ref,
    maximized,
    catalogMax: studioPaneMax(host, args.inspectorWidth),
    inspectorMax: studioPaneMax(host, args.catalogWidth),
    onCatalogWidth: args.onCatalogWidth,
    onInspectorWidth: args.onInspectorWidth,
    toggle,
  };
}
