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
  LivingRoomRecoverySnapshot,
  LivingRoomStyleId,
  ImportedAsset,
  Phase1BenchmarkId,
} from "../../domain/livingRoom";

export type LivingRoomWorkspaceView = "plan" | "model" | "render";
export type PlannerMode = "project" | "build" | "design" | "render";
/** V1 plan surfaces only. AI styling, styleboards, and marketplaces are deliberately out of scope. */
export type StudioPanel = "build" | "cabinets" | "furniture" | "materials" | "layers";
export type { BuildTool } from "../../domain/livingRoom/buildToolCommands";
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
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onAddPartitionWall: () => void;
  onCreateRoom: (drawing: import("../../domain/interiorProject").RoomDrawingRequest) => void;
  onDrawWallSegment: (start: import("../../domain/interiorProject").Point2Mm, end: import("../../domain/interiorProject").Point2Mm, wallKind?: "wall" | "partition") => void;
  onDrawSurface: (drawing: import("../../domain/interiorProject").RoomDrawingRequest, materialId: string) => void;
  onUpdateSurface: (surfaceId: string, materialId: string) => void;
  onDeleteSurface: (surfaceId: string) => void;
  onPlaceColumn: (position: import("../../domain/interiorProject").Point2Mm) => void;
  onSplitWall: (wallId: string, offsetMm?: number) => string | null;
  onDeleteWall: (wallId: string) => void;
  onUpdateWall: (wallId: string, patch: { thicknessMm?: number }) => void;
  onJoinCoincidentNodes: () => void;
  onAddOpening: (wallId: string, kind: "door" | "window", offsetMm?: number, catalogItemId?: string) => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "swingDirection" | "materialSlots" | "parameters">>) => void;
  onDeleteOpening: (openingId: string) => void;
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
