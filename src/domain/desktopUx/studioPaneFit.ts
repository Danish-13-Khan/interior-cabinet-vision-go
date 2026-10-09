export const STUDIO_PANE_MIN = 160;
/** Below this the inspector's W/H/D fields and finish cards truncate. */
export const STUDIO_INSPECTOR_MIN = 300;
export const STUDIO_PANE_MAX = 720;
export const STUDIO_CANVAS_MIN = 280;

/** Drag widths stay inside the viewport so the canvas keeps a minimum strip. */
export function studioPaneMax(hostWidth: number, otherWidth: number) {
  const room = hostWidth - otherWidth - STUDIO_CANVAS_MIN;
  return Math.max(STUDIO_PANE_MIN, Math.min(STUDIO_PANE_MAX, Math.round(room)));
}

/** A stored width that fits the current host: never under the pane minimum, never over the canvas-safe max. */
export function studioPaneWidth(stored: number, min: number, max: number) {
  return Math.round(Math.max(STUDIO_PANE_MIN, Math.min(max, Math.max(min, stored))));
}

export type StudioPaneFitInput = {
  /** Workspace body width. */
  hostWidth: number;
  /** Full-height columns beside the panes that are neither pane nor canvas (e.g. the 3D tool rail). */
  chromeWidth: number;
  catalog: number;
  inspector: number;
  catalogShown: boolean;
  inspectorShown: boolean;
  /** Defaults to STUDIO_INSPECTOR_MIN. */
  inspectorMin?: number;
};

export type StudioPaneFit = {
  catalogWidth: number;
  catalogMax: number;
  inspectorWidth: number;
  inspectorMax: number;
};

/**
 * Resolves the displayed pane widths for the current window. Stored widths are
 * never rewritten here, so growing the window brings them back. When the window
 * is too narrow the catalog gives way first, then the inspector. A pane's drag
 * max is measured against the other pane's displayed width, so dragging one
 * pane never squeezes the other.
 */
export function fitStudioPanes(input: StudioPaneFitInput): StudioPaneFit {
  const host = Math.max(0, input.hostWidth - input.chromeWidth);
  const room = host - STUDIO_CANVAS_MIN;
  const inspectorMin = input.inspectorMin ?? STUDIO_INSPECTOR_MIN;
  let inspector = input.inspectorShown ? clamp(input.inspector, inspectorMin, STUDIO_PANE_MAX) : 0;
  let catalog = input.catalogShown ? clamp(input.catalog, STUDIO_PANE_MIN, STUDIO_PANE_MAX) : 0;
  if (catalog + inspector > room && input.catalogShown) {
    catalog = Math.max(STUDIO_PANE_MIN, room - inspector);
  }
  if (catalog + inspector > room && input.inspectorShown) {
    inspector = Math.max(inspectorMin, room - catalog);
  }
  const catalogMax = studioPaneMax(host, inspector);
  const inspectorMax = studioPaneMax(host, catalog);
  return {
    catalogWidth: input.catalogShown ? Math.min(catalog, catalogMax) : clamp(input.catalog, STUDIO_PANE_MIN, catalogMax),
    catalogMax,
    inspectorWidth: input.inspectorShown ? inspector : clamp(input.inspector, inspectorMin, inspectorMax),
    inspectorMax,
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.round(Math.min(max, Math.max(min, value)));
}
