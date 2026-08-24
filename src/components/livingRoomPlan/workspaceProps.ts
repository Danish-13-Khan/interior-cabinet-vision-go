import type {
  InteriorObjectEntity,
  InteriorProject,
  OpeningEntity,
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
  LivingRoomLayerId,
  LivingRoomPlanIssue,
  LivingRoomPlanUnderlay,
  AdvancedStudioState,
  LivingRoomRecoverySnapshot,
  LivingRoomStyleId,
  ImportedAsset,
  Phase1BenchmarkId,
} from "../../domain/livingRoom";

export type LivingRoomWorkspaceView = "plan" | "model" | "render";
export type PlannerMode = "project" | "build" | "design" | "render";
export type StudioPanel = "build" | "cabinets" | "furniture" | "materials" | "layers" | "advanced";
export type PlannerStarterTemplate = "blank-room" | "wardrobe-wall" | "import-plan";

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
  onCreateStarter: (options?: { projectName?: string; styleId?: LivingRoomStyleId; template?: PlannerStarterTemplate }) => void;
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
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onSetFloorMaterial: (materialId: string) => void;
  onSetWallMaterial: (wallId: string, materialId: string) => void;
  onSetLayerVisibility: (layer: LivingRoomLayerId, visible: boolean) => void;
  onRotateSelection: (deltaDegrees: number) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId, wallId?: string) => void;
  onAddImportedAsset: (asset: ImportedAsset) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onCreateCabinetRun: (wallId: string) => void;
  onNudge: (dx: number, dz: number) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "swingDirection">>) => void;
  onDeleteOpening: (openingId: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onUpdateAdvancedStudio: (state: AdvancedStudioState) => void;
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
