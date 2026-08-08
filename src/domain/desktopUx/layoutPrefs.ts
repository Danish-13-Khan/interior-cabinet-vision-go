export const DESKTOP_LAYOUT_STORAGE_KEY = "cabinet-designer-desktop-layout";

export type WorkspaceTabId = "plan" | "front" | "side" | "3d";

export type DrawingSheetId =
  | "plan"
  | "front"
  | "side"
  | "section"
  | "detail"
  | "report";

export type DesktopLayoutPrefs = {
  toolRailWidthPx: number;
  inspectorWidthPx: number;
  statusDockHeightPx: number;
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  statusDockOpen: boolean;
  workspaceTab: WorkspaceTabId;
  /** Active technical drawing sheet in the drafting area. */
  activeSheetId: DrawingSheetId;
  /** Plan column share vs elevation (percent). */
  splitPlanWidthPct: number;
  /** Top drafting row share vs 3D (percent). */
  splitTopRowPct: number;
  sceneBrowserVisible: boolean;
  sheetBrowserVisible: boolean;
};

export const DEFAULT_DESKTOP_LAYOUT: DesktopLayoutPrefs = {
  toolRailWidthPx: 200,
  inspectorWidthPx: 280,
  statusDockHeightPx: 260,
  toolRailVisible: true,
  inspectorVisible: true,
  statusDockOpen: false,
  workspaceTab: "front",
  activeSheetId: "front",
  splitPlanWidthPct: 50,
  splitTopRowPct: 68,
  sceneBrowserVisible: true,
  sheetBrowserVisible: true,
};

const WIDTH_MIN = 160;
const WIDTH_MAX = 480;
const DOCK_MIN = 160;
const DOCK_MAX = 520;
const SPLIT_MIN = 28;
const SPLIT_MAX = 72;

export function clampDesktopLayout(
  value: Partial<DesktopLayoutPrefs> | null | undefined,
): DesktopLayoutPrefs {
  const next = { ...DEFAULT_DESKTOP_LAYOUT, ...(value ?? {}) };
  return {
    toolRailWidthPx: clamp(next.toolRailWidthPx, WIDTH_MIN, WIDTH_MAX),
    inspectorWidthPx: clamp(next.inspectorWidthPx, WIDTH_MIN, WIDTH_MAX),
    statusDockHeightPx: clamp(next.statusDockHeightPx, DOCK_MIN, DOCK_MAX),
    toolRailVisible: Boolean(next.toolRailVisible),
    inspectorVisible: Boolean(next.inspectorVisible),
    statusDockOpen: Boolean(next.statusDockOpen),
    workspaceTab: normalizeWorkspaceTab(next.workspaceTab),
    activeSheetId: normalizeDrawingSheetId(next.activeSheetId ?? next.workspaceTab),
    splitPlanWidthPct: clamp(next.splitPlanWidthPct, SPLIT_MIN, SPLIT_MAX),
    splitTopRowPct: clamp(next.splitTopRowPct, SPLIT_MIN, SPLIT_MAX),
    sceneBrowserVisible: next.sceneBrowserVisible !== false,
    sheetBrowserVisible: next.sheetBrowserVisible !== false,
  };
}

export function normalizeWorkspaceTab(value: unknown): WorkspaceTabId {
  if (value === "plan" || value === "front" || value === "side" || value === "3d") {
    return value;
  }
  return "plan";
}

export function normalizeDrawingSheetId(value: unknown): DrawingSheetId {
  if (
    value === "plan" ||
    value === "front" ||
    value === "side" ||
    value === "section" ||
    value === "detail" ||
    value === "report"
  ) {
    return value;
  }
  return "plan";
}

export function readDesktopLayout(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): DesktopLayoutPrefs {
  if (!storage) return { ...DEFAULT_DESKTOP_LAYOUT };
  try {
    const raw = storage.getItem(DESKTOP_LAYOUT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DESKTOP_LAYOUT };
    return clampDesktopLayout(JSON.parse(raw) as Partial<DesktopLayoutPrefs>);
  } catch {
    return { ...DEFAULT_DESKTOP_LAYOUT };
  }
}

export function persistDesktopLayout(
  layout: DesktopLayoutPrefs,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  storage.setItem(
    DESKTOP_LAYOUT_STORAGE_KEY,
    JSON.stringify(clampDesktopLayout(layout)),
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
