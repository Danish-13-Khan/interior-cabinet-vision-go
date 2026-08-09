export type PaneViewTransform = {
  zoom: number;
  panX: number;
  panY: number;
};

export const DEFAULT_PANE_VIEW: PaneViewTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

export const PANE_ZOOM_MIN = 0.35;
export const PANE_ZOOM_MAX = 4;
export const PANE_ZOOM_STEP = 1.2;

export function clampPaneView(
  value: Partial<PaneViewTransform> | null | undefined,
): PaneViewTransform {
  const zoom = Number(value?.zoom);
  const panX = Number(value?.panX);
  const panY = Number(value?.panY);
  return {
    zoom: clamp(
      Number.isFinite(zoom) ? zoom : DEFAULT_PANE_VIEW.zoom,
      PANE_ZOOM_MIN,
      PANE_ZOOM_MAX,
    ),
    panX: Number.isFinite(panX) ? Math.round(panX * 10) / 10 : 0,
    panY: Number.isFinite(panY) ? Math.round(panY * 10) / 10 : 0,
  };
}

export function zoomPaneView(
  current: PaneViewTransform,
  factor: number,
  originX = 0,
  originY = 0,
): PaneViewTransform {
  const before = clampPaneView(current);
  const nextZoom = clamp(before.zoom * factor, PANE_ZOOM_MIN, PANE_ZOOM_MAX);
  const scale = nextZoom / before.zoom;
  return clampPaneView({
    zoom: nextZoom,
    panX: originX - (originX - before.panX) * scale,
    panY: originY - (originY - before.panY) * scale,
  });
}

export function panPaneView(
  current: PaneViewTransform,
  dx: number,
  dy: number,
): PaneViewTransform {
  const before = clampPaneView(current);
  return clampPaneView({
    zoom: before.zoom,
    panX: before.panX + dx,
    panY: before.panY + dy,
  });
}

/** Fit content into viewport with padding; centers and scales. */
export function fitPaneView(
  content: { width: number; height: number },
  viewport: { width: number; height: number },
  padding = 12,
): PaneViewTransform {
  const cw = Math.max(1, content.width);
  const ch = Math.max(1, content.height);
  const vw = Math.max(1, viewport.width - padding * 2);
  const vh = Math.max(1, viewport.height - padding * 2);
  const zoom = clamp(Math.min(vw / cw, vh / ch, 1.5), PANE_ZOOM_MIN, PANE_ZOOM_MAX);
  const panX = (viewport.width - cw * zoom) / 2;
  const panY = (viewport.height - ch * zoom) / 2;
  return clampPaneView({ zoom, panX, panY });
}

export function formatPaneZoomPercent(zoom: number) {
  return `${Math.round(clampPaneView({ zoom }).zoom * 100)}%`;
}

export function formatPaneScaleLabel(sheetScaleText: string, zoom: number) {
  return `${sheetScaleText} · ${formatPaneZoomPercent(zoom)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
