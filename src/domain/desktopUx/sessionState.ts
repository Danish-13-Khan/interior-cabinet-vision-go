import {
  clampDesktopLayout,
  DEFAULT_DESKTOP_LAYOUT,
  type DesktopLayoutPrefs,
  type WorkspaceTabId,
} from "./layoutPrefs";

export const SESSION_STATE_STORAGE_KEY = "cabinet-designer-session-state";

export type DesktopSessionState = {
  projectFilePath: string | null;
  workspaceTab: WorkspaceTabId;
  draftingTool: "select" | "note" | "leader";
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  restoreLastFile: boolean;
  layout: DesktopLayoutPrefs;
  updatedAt: string;
};

export const DEFAULT_SESSION_STATE: DesktopSessionState = {
  projectFilePath: null,
  workspaceTab: "plan",
  draftingTool: "select",
  selectedCabinetIds: [],
  activeCabinetId: null,
  restoreLastFile: true,
  layout: { ...DEFAULT_DESKTOP_LAYOUT },
  updatedAt: new Date(0).toISOString(),
};

export function clampSessionState(
  value: Partial<DesktopSessionState> | null | undefined,
): DesktopSessionState {
  const draftingTool =
    value?.draftingTool === "note" || value?.draftingTool === "leader"
      ? value.draftingTool
      : "select";
  const selectedCabinetIds = Array.isArray(value?.selectedCabinetIds)
    ? value!.selectedCabinetIds.filter((id): id is string => typeof id === "string")
    : [];
  return {
    projectFilePath:
      typeof value?.projectFilePath === "string" && value.projectFilePath.trim()
        ? value.projectFilePath
        : null,
    workspaceTab: clampDesktopLayout({ workspaceTab: value?.workspaceTab }).workspaceTab,
    draftingTool,
    selectedCabinetIds,
    activeCabinetId:
      typeof value?.activeCabinetId === "string" ? value.activeCabinetId : null,
    restoreLastFile: value?.restoreLastFile !== false,
    layout: clampDesktopLayout(value?.layout),
    updatedAt:
      typeof value?.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function readSessionState(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): DesktopSessionState {
  if (!storage) return { ...DEFAULT_SESSION_STATE };
  try {
    const raw = storage.getItem(SESSION_STATE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SESSION_STATE };
    return clampSessionState(JSON.parse(raw) as Partial<DesktopSessionState>);
  } catch {
    return { ...DEFAULT_SESSION_STATE };
  }
}

export function persistSessionState(
  state: DesktopSessionState,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  storage.setItem(
    SESSION_STATE_STORAGE_KEY,
    JSON.stringify(
      clampSessionState({
        ...state,
        updatedAt: new Date().toISOString(),
      }),
    ),
  );
}
