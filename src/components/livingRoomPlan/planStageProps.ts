import type { InteriorProject, Point3Mm, RenderSettings, RoomDrawingRequest, Size3Mm } from "../../domain/interiorProject";
import type {
  BuildTool,
  LivingRoomAlignMode,
  LivingRoomLightingRecipeId,
  LivingRoomPlanIssue,
  LivingRoomRenderResult,
  LivingRoomStyleId,
  PlanReadabilitySettings,
} from "../../domain/livingRoom";
import type { AcceptedStillAsset } from "../../hooks/selectPackageAcceptedStillAssets";
import type { useClientPresentationExport } from "../../hooks/useClientPresentationExport";
import type { InteriorsChromeTool } from "../../domain/desktopUx";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import type { InteriorsDrawRoomCommands } from "./interiorsDrawRoomCommands";
import type { InteriorsCabinetRunCommands } from "./interiorsCabinetRunCommands";
import type { InteriorsPresentCommands } from "./interiorsPresentCommands";

export type LivingRoomPlanStageProps = {
  project: InteriorProject;
  workspaceView: LivingRoomWorkspaceView;
  selectedIds: string[];
  issues: LivingRoomPlanIssue[];
  snapSizeMm: number;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  latestRender: LivingRoomRenderResult | null;
  previousRender: LivingRoomRenderResult | null;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  activeSurfaceId: string | null;
  surfaceMaterialId: string;
  onSelectWall: (wallId: string) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectSurface: (surfaceId: string | null) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  onMoveNode: (nodeId: string, position: import("../../domain/interiorProject").Point2Mm) => void;
  onTranslateWall: (wallId: string, delta: import("../../domain/interiorProject").Point2Mm) => void;
  activeBuildTool?: BuildTool;
  openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
  onCreateRoom: (drawing: RoomDrawingRequest) => void;
  onDrawSurface: (drawing: RoomDrawingRequest, materialId: string) => void;
  onDrawWallSegment: (start: import("../../domain/interiorProject").Point2Mm, end: import("../../domain/interiorProject").Point2Mm, wallKind?: "wall" | "partition") => void;
  onPlaceColumn: (position: import("../../domain/interiorProject").Point2Mm) => void;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelection: (delta: number) => void;
  onAlign: (mode: LivingRoomAlignMode) => void;
  onCreateCabinetRun: () => void;
  onRenderSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
  onRenderBrowserThumbnail?: (dataUrl: string) => void;
  onRendered: (result: LivingRoomRenderResult) => void;
  acceptedStillAssets: AcceptedStillAsset[];
  onAcceptedStillAssetsChange: React.Dispatch<React.SetStateAction<AcceptedStillAsset[]>>;
  clientExport: ReturnType<typeof useClientPresentationExport>;
  clientPackageBlocked: boolean;
  v2BuildMode?: boolean;
  v2ReviewMode?: boolean;
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
  chromeTool?: InteriorsChromeTool;
  roomPolygonPointCount?: number;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  onCloseRoomPolygon?: () => void;
  onCommitOpening?: (wallId: string, kind: "door" | "window") => void;
  drawCommands?: InteriorsDrawRoomCommands;
  cabinetRunCommands?: InteriorsCabinetRunCommands;
  presentCommands?: InteriorsPresentCommands;
  presenting?: boolean;
  onSelectRoom?: () => void;
};
