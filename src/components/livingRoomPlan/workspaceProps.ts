import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  RenderSettings,
  Size3Mm,
} from "../../domain/interiorProject";
import type { SavedProjectBrowserEntry } from "../../domain/projectBrowserStorage";
import type { WorkbenchMode } from "../../domain/desktopUx";
import type {
  LivingRoomAlignMode,
  LivingRoomCatalogId,
  LivingRoomLightingRecipeId,
  LivingRoomPlanIssue,
  LivingRoomPlanUnderlay,
  LivingRoomRecoverySnapshot,
  LivingRoomStyleId,
  Phase1BenchmarkId,
} from "../../domain/livingRoom";

export type LivingRoomWorkspaceView = "plan" | "model" | "render";
export type StudioPanel = "assets" | "layers" | "underlay";

export type LivingRoomPlanWorkspaceProps = {
  project: InteriorProject | null;
  selectedIds: string[];
  selectedObjects: InteriorObjectEntity[];
  issues: LivingRoomPlanIssue[];
  canUndo: boolean;
  canRedo: boolean;
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  toolRailWidthPx: number;
  inspectorWidthPx: number;
  projectHomeOpen: boolean;
  isDirty: boolean;
  autosaveState: "idle" | "saving" | "saved" | "error";
  lastAutosavedAt: string | null;
  recovery: LivingRoomRecoverySnapshot | null;
  recentProjects: SavedProjectBrowserEntry[];
  onCreateStarter: (options?: { projectName?: string; styleId?: LivingRoomStyleId }) => void;
  onOpenDemo: () => void;
  onOpenPhase1Benchmark: (benchmarkId: Phase1BenchmarkId) => void;
  onOpenProjectHome: () => void;
  onCloseProjectHome: () => void;
  onOpenRecentProject: (projectId: string) => void;
  onDeleteRecentProject: (projectId: string) => void;
  onRestoreRecovery: () => void;
  onDiscardRecovery: () => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onRotateSelection: (deltaDegrees: number) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onNudge: (dx: number, dz: number) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onRenderSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
  onRenderBrowserThumbnail?: (dataUrl: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onWorkbenchModeChange: (mode: WorkbenchMode) => void;
};
