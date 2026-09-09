import type { InteriorProject, OpeningEntity, Size3Mm } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import type { ImportedAsset, LivingRoomPlanIssue } from "../../domain/livingRoom";
import type { InteriorsChromeTool, InteriorsWorkflowArea } from "../../domain/desktopUx";
import type { BuildTool, StudioPanel } from "./workspaceProps";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

export type LivingRoomPlanCatalogRailProps = {
  widthPx: number;
  toolRailVisible: boolean;
  workflowArea: InteriorsWorkflowArea;
  studioPanel: StudioPanel;
  onStudioPanel: (panel: StudioPanel) => void;
  chromeTool: InteriorsChromeTool;
  onChromeTool: (tool: InteriorsChromeTool) => void;
  project: InteriorProject;
  roomName: string;
  selectedIds: string[];
  assetQuery: string;
  assetCategory: string;
  assetCategories: string[];
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  issues: LivingRoomPlanIssue[];
  proposal: ReturnType<typeof useProposalWorkflow>;
  onPresent: () => void;
  onAssetQuery: (value: string) => void;
  onAssetCategory: (value: string) => void;
  onAddCatalogObject: (catalogItemId: string, wallId?: string) => void;
  onCreateCabinetRun: (wallId: string) => void;
  onAddImportedAsset: (asset: ImportedAsset) => void;
  onSetFloorMaterial: (materialId: string) => void;
  onSetCeilingMaterial: (materialId: string) => void;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
  onApplyMaterialToSelection: (materialId: string, slotName?: string) => void;
  onApplyMaterialColour: (
    materialId: string,
    color: string,
    rebinds: import("../../domain/catalog/finishRebind").FinishUvRebind[],
  ) => void;
  onImportFinish?: (
    source: import("../../domain/livingRoom").FinishImportDraft | File,
    apply?: {
      wallId?: string;
      floor?: boolean;
      ceiling?: boolean;
      selection?: { objectIds: readonly string[]; slotName?: string };
    },
  ) => void;
  onSetLayerVisibility: (layer: "walls" | "openings" | "furniture", visible: boolean) => void;
  onSelect: (objectId: string) => void;
  onSelectIssue: (objectId: string | null) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onCalibrateUnderlay?: () => void;
  onToggleSiteMeasure?: (key: import("../../domain/livingRoom").SiteMeasureUserKey, value: boolean) => void;
  onImportUnderlay: (file: File | null) => void;
  onRegisterUnderlayPicker?: (openPicker: () => void) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onActiveRoom?: (roomId: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  onAddPartitionWall: () => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onActiveWall: (wallId: string) => void;
  onActiveOpening: (openingId: string) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots">>) => void;
  onDeleteOpening: (openingId: string) => void;
  activeBuildTool?: BuildTool;
  openingCatalogItemId?: string;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  roomPolygonPointCount?: number;
  onCloseRoomPolygon?: () => void;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onUpdateWallThickness?: (wallId: string, thicknessMm: number) => void;
  onJoinCoincidentNodes?: () => void;
  activeSurfaceId?: string | null;
  surfaceMaterialId?: string;
  onSurfaceMaterialId?: (materialId: string) => void;
  onCloseSurfacePolygon?: () => void;
  onUpdateSurface?: (surfaceId: string, materialId: string) => void;
  onDeleteSurface?: (surfaceId: string) => void;
  presenting?: boolean;
};
