import type { InteriorProject, OpeningEntity, Size3Mm, WallEntity } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import type { ImportedAsset, LivingRoomCatalogItem } from "../../domain/livingRoom";
import type { InteriorsWorkflowCatalogView } from "../../domain/desktopUx";
import type { BuildTool } from "./workspaceProps";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

export type InteriorsWorkflowAreaPanelProps = {
  view: InteriorsWorkflowCatalogView;
  project: InteriorProject;
  roomName: string;
  tool: BuildTool;
  activeWall: WallEntity | null;
  activeOpening: OpeningEntity | null;
  activeSurfaceId: string | null;
  surfaceMaterialId?: string;
  roomDimensions: Size3Mm;
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  openingCatalogItemId?: string;
  roomPolygonPointCount?: number;
  visibleAssets: LivingRoomCatalogItem[];
  assetQuery: string;
  assetCategory: string;
  assetCategories: string[];
  selectedIds: string[];
  selectedCabinetCount: number;
  chromeTool: import("../../domain/desktopUx").InteriorsChromeTool;
  issues: import("../../domain/livingRoom").LivingRoomPlanIssue[];
  proposal: ReturnType<typeof useProposalWorkflow>;
  underlayInputRef: React.RefObject<HTMLInputElement | null>;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onAddPartitionWall: () => void;
  onActiveRoom?: (roomId: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  onActiveWall: (wallId: string) => void;
  onActiveOpening: (openingId: string) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots">>) => void;
  onDeleteOpening: (openingId: string) => void;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  onCloseRoomPolygon?: () => void;
  onCloseSurfacePolygon?: () => void;
  onSurfaceMaterialId?: (materialId: string) => void;
  onUpdateSurface?: (surfaceId: string, materialId: string) => void;
  onDeleteSurface?: (surfaceId: string) => void;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onUpdateWallThickness?: (wallId: string, thicknessMm: number) => void;
  onJoinCoincidentNodes?: () => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
  onCalibrateUnderlay?: () => void;
  onToggleSiteMeasure?: (key: import("../../domain/livingRoom").SiteMeasureUserKey, value: boolean) => void;
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
  onSelect: (objectId: string) => void;
  onSelectIssue: (objectId: string | null) => void;
  onPresent: () => void;
};
