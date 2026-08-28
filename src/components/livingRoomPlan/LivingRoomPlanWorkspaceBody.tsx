import type { InteriorProject, InteriorRoomEntity, OpeningEntity } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import { isBlockingLivingRoomPlanIssue, type BuildTool, type LivingRoomPlanIssue, type LivingRoomRenderResult, type PlanReadabilitySettings } from "../../domain/livingRoom";
import { LivingRoomHomeFromWorkspace } from "./LivingRoomHomeFromWorkspace";
import { LivingRoomInspectorPanel } from "./LivingRoomInspectorPanel";
import { LivingRoomPlanCatalogRail } from "./LivingRoomPlanCatalogRail";
import { LivingRoomPlanStage } from "./LivingRoomPlanStage";
import { PlannerV2ReviewPanel } from "./PlannerV2ReviewPanel";
import type { LivingRoomPlanWorkspaceProps, LivingRoomWorkspaceView, PlannerMode, StudioPanel } from "./workspaceProps";
import type { useLivingRoomBuildCommands } from "../../hooks/useLivingRoomBuildCommands";
import { imageFileToUnderlay } from "../../domain/livingRoom/planUnderlayImport";
import type { useMillworkSchedule } from "../../hooks/useMillworkSchedule";

type BuildBridge = ReturnType<typeof useLivingRoomBuildCommands>;
type Millwork = ReturnType<typeof useMillworkSchedule>;

type Props = {
  workspace: LivingRoomPlanWorkspaceProps;
  project: InteriorProject;
  room: InteriorRoomEntity;
  underlay: LivingRoomPlanUnderlay | null;
  workspaceView: LivingRoomWorkspaceView;
  plannerMode: PlannerMode;
  studioPanel: StudioPanel;
  onStudioPanel: (panel: StudioPanel) => void;
  assetQuery: string;
  assetCategory: string;
  assetCategories: string[];
  importError: string;
  onAssetQuery: (value: string) => void;
  onAssetCategory: (value: string) => void;
  onImportError: (message: string) => void;
  snapSizeMm: number;
  showGrid: boolean;
  onShowGrid: (value: boolean) => void;
  onSnapSize: (value: number) => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  activeSurfaceId: string | null;
  setActiveSurfaceId: React.Dispatch<React.SetStateAction<string | null>>;
  activeOpening: OpeningEntity | null;
  setActiveWallId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveOpeningId: React.Dispatch<React.SetStateAction<string | null>>;
  roomPolygonPointCount: number;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
  onRoomPolygonCloseRequest: () => void;
  renderResults: { latest: LivingRoomRenderResult | null; previous: LivingRoomRenderResult | null };
  onRenderResults: (result: LivingRoomRenderResult) => void;
  build: BuildBridge;
  activeBuildTool: BuildTool;
  onBuildTool: (tool: BuildTool) => void;
  underlayPickerRef: React.RefObject<(() => void) | null>;
  millwork: Millwork;
  issues: LivingRoomPlanIssue[];
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
};

export function LivingRoomPlanWorkspaceBody(props: Props) {
  const { workspace: w, project, room, build } = props;
  const activeObject = w.selectedObjects[0] ?? null;

  return (
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      <LivingRoomHomeFromWorkspace workspace={w} open={w.projectHomeOpen} hasCurrentProject />
      {props.workspaceView === "plan" ? (
        <LivingRoomPlanCatalogRail
          widthPx={w.toolRailWidthPx} toolRailVisible={w.toolRailVisible} studioPanel={props.studioPanel}
          onStudioPanel={props.onStudioPanel} project={project} roomName={room.name} selectedIds={w.selectedIds}
          assetQuery={props.assetQuery} assetCategory={props.assetCategory} assetCategories={props.assetCategories}
          underlay={props.underlay} importError={props.importError} onAssetQuery={props.onAssetQuery}
          onAssetCategory={props.onAssetCategory} onAddCatalogObject={w.onAddCatalogObject}
          onCreateCabinetRun={w.onCreateCabinetRun}
          onAddImportedAsset={w.onAddImportedAsset} onSetFloorMaterial={w.onSetFloorMaterial}
          onSetWallMaterial={w.onSetWallMaterial} onSetObjectMaterial={w.onSetMaterial}
          onSetLayerVisibility={w.onSetLayerVisibility}
          onSelect={(objectId) => { props.setActiveOpeningId(null); props.setActiveSurfaceId(null); w.onSelect(objectId); }}
          onSetPlanUnderlay={w.onSetPlanUnderlay}
          onRoomDimensions={(dimensions) => build.dispatchBuildCommand({ type: "resizeRoom", dimensions })}
          onActiveRoom={(roomId) => {
            w.onActiveRoom(roomId);
            props.setActiveOpeningId(null);
            props.setActiveSurfaceId(null);
            props.setActiveWallId(null);
          }}
          onRenameRoom={w.onRenameRoom}
          onDeleteRoom={w.onDeleteRoom}
          onMergeRooms={w.onMergeRooms}
          onAddPartitionWall={() => build.dispatchBuildCommand({ type: "createWall" })}
          activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
          onActiveWall={(wallId) => props.setActiveWallId(wallId)}
          onActiveOpening={(openingId) => {
            props.setActiveOpeningId(openingId);
            const opening = project.openings.find((item) => item.id === openingId);
            if (opening) props.setActiveWallId(opening.wallId);
          }}
          onAddOpening={(wallId, kind) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, catalogItemId: build.openingCatalogItemId })}
          onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
          onDeleteOpening={(openingId) => { build.dispatchBuildCommand({ type: "deleteOpening", openingId }); props.setActiveOpeningId(null); }}
          v2BuildMode={props.plannerMode === "build"} v2DesignMode={props.plannerMode === "design"}
          activeBuildTool={props.activeBuildTool} onBuildTool={props.onBuildTool}
          canUndo={w.canUndo} canRedo={w.canRedo} onUndo={w.onUndo} onRedo={w.onRedo}
          openingCatalogItemId={build.openingCatalogItemId} onOpeningCatalogItem={build.setOpeningCatalogItemId}
          roomPolygonPointCount={props.roomPolygonPointCount} onCloseRoomPolygon={props.onRoomPolygonCloseRequest}
          onSplitWall={(wallId) => build.dispatchBuildCommand({ type: "splitWall", wallId })}
          onDeleteWall={(wallId) => {
            build.dispatchBuildCommand({ type: "deleteWall", wallId });
            props.setActiveWallId((current) => (current === wallId ? project.walls.find((wall) => wall.id !== wallId)?.id ?? null : current));
          }}
          onUpdateWallThickness={(wallId, thicknessMm) => build.dispatchBuildCommand({ type: "updateWall", wallId, patch: { thicknessMm } })}
          onJoinCoincidentNodes={() => build.dispatchBuildCommand({ type: "joinCoincidentNodes" })}
          surfaceMaterialId={build.surfaceMaterialId}
          onSurfaceMaterialId={build.setSurfaceMaterialId}
          activeSurfaceId={props.activeSurfaceId}
          onCloseSurfacePolygon={props.onRoomPolygonCloseRequest}
          onUpdateSurface={(surfaceId, materialId) => build.dispatchBuildCommand({ type: "updateSurface", surfaceId, materialId })}
          onDeleteSurface={(surfaceId) => {
            build.dispatchBuildCommand({ type: "deleteSurface", surfaceId });
            props.setActiveSurfaceId((current) => (current === surfaceId ? null : current));
          }}
          onRegisterUnderlayPicker={(openPicker) => { props.underlayPickerRef.current = openPicker; }}
          onImportUnderlay={async (file) => {
            if (!file) return;
            props.onImportError("");
            try {
              w.onSetPlanUnderlay(await imageFileToUnderlay(file, room.dimensions.widthMm));
              props.onStudioPanel("build");
              build.dispatchBuildCommand({ type: "commitDraft" });
            } catch (error) {
              props.onImportError(error instanceof Error ? error.message : "Plan import failed.");
            }
          }}
        />
      ) : null}
      {props.plannerMode === "render" ? (
        <PlannerV2ReviewPanel schedule={props.millwork.schedule} issues={props.issues} busy={props.millwork.busy}
          status={props.millwork.status} onCsv={() => void props.millwork.exportSchedule("schedule-csv")}
          onPdf={() => void props.millwork.exportSchedule("pdf")}
          onSelect={(objectId) => { props.setActiveOpeningId(null); props.setActiveSurfaceId(null); w.onSelect(objectId); }} />
      ) : null}
      <LivingRoomPlanStage
        project={project} workspaceView={props.workspaceView} selectedIds={w.selectedIds} issues={props.issues}
        snapSizeMm={props.snapSizeMm} showGrid={props.showGrid} canUndo={w.canUndo} canRedo={w.canRedo}
        hasSelection={Boolean(activeObject)} millworkCount={props.millwork.workflow?.millworkCount ?? 0}
        millworkReady={props.millwork.workflow?.readyToExport ?? false} exportBusy={props.millwork.busy}
        exportBlocked={props.issues.some(isBlockingLivingRoomPlanIssue)}
        exportStatus={props.millwork.status} autosaveState={w.autosaveState} lastAutosavedAt={w.lastAutosavedAt}
        latestRender={props.renderResults.latest} previousRender={props.renderResults.previous}
        onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize}
        onSelect={(objectId, additive) => { props.setActiveOpeningId(null); props.setActiveSurfaceId(null); w.onSelect(objectId, additive); }}
        onMove={w.onMove} onResize={w.onResize}         activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
        activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={build.surfaceMaterialId}
        onSelectWall={(wallId) => { props.setActiveOpeningId(null); props.setActiveSurfaceId(null); props.setActiveWallId(wallId); }}
        onSelectOpening={(openingId) => {
          props.setActiveOpeningId(openingId);
          props.setActiveSurfaceId(null);
          const opening = project.openings.find((item) => item.id === openingId);
          if (opening) props.setActiveWallId(opening.wallId);
        }}
        onSelectSurface={(surfaceId) => {
          props.setActiveSurfaceId(surfaceId);
          props.setActiveOpeningId(null);
          w.onSelect(null);
        }}
        onMoveOpening={(openingId, offsetMm) => build.dispatchBuildCommand({ type: "moveOpening", openingId, offsetMm })}
        onResizeOpening={(openingId, widthMm, offsetMm) => build.dispatchBuildCommand({ type: "resizeOpening", openingId, widthMm, offsetMm })}
        onMoveNode={(nodeId, position) => build.dispatchBuildCommand({ type: "moveNode", nodeId, position })}
        onTranslateWall={(wallId, delta) => build.dispatchBuildCommand({ type: "moveWall", wallId, delta })}
        activeBuildTool={props.activeBuildTool} openingCatalogItemId={build.openingCatalogItemId}
        onPlaceOpening={(wallId, kind, offsetMm) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, offsetMm, catalogItemId: build.openingCatalogItemId })}
        onCreateRoom={(drawing) => build.dispatchBuildCommand({ type: "createRoom", drawing })}
        onDrawSurface={(drawing, materialId) => build.dispatchBuildCommand({ type: "createSurface", drawing, materialId })}
        onDrawWallSegment={(start, end, wallKind) => build.dispatchBuildCommand({ type: "createWallSegment", start, end, wallKind })}
        onPlaceColumn={(position) => build.dispatchBuildCommand({ type: "placeColumn", position })}
        roomPolygonCloseRequest={props.roomPolygonCloseRequest} onRoomPolygonPointCount={props.onRoomPolygonPointCount}
        onSetRotation={w.onSetRotation} onSetParameters={w.onSetParameters} onApplyStyle={w.onApplyStyle}
        onUndo={w.onUndo} onRedo={w.onRedo} onDuplicate={w.onDuplicate} onDelete={w.onDelete}
        onRotateSelection={w.onRotateSelection} onAlign={w.onAlign}
        onCreateCabinetRun={() => props.activeWallId && w.onCreateCabinetRun(props.activeWallId)}
        onRenderSettingsChange={w.onRenderSettingsChange} onLightingChange={w.onLightingChange}
        onRenderBrowserThumbnail={w.onRenderBrowserThumbnail}
        onRendered={props.onRenderResults}
        onExportScheduleCsv={() => void props.millwork.exportSchedule("schedule-csv")}
        onExportCutlistCsv={() => void props.millwork.exportSchedule("cutlist-csv")}
        onExportPdf={() => void props.millwork.exportSchedule("pdf")}
        v2BuildMode={props.plannerMode === "build"} v2ReviewMode={props.workspaceView === "model"}
        readability={props.readability} onReadability={props.onReadability}
      />
      {w.inspectorVisible && props.workspaceView !== "render" ? (
        <LivingRoomInspectorPanel mode={props.workspaceView} widthPx={w.inspectorWidthPx} project={project} room={room}
          activeObject={activeObject} activeOpening={props.activeOpening} selectedCount={w.selectedIds.length}
          issues={props.issues} millworkSchedule={props.millwork.schedule} millworkWorkflow={props.millwork.workflow}
          productionReport={props.millwork.productionReport} millworkExportedAt={props.millwork.exportedAt}
          onRoomDimensions={w.onRoomDimensions} onMove={w.onMove} onResize={w.onResize}
          onSetRotation={w.onSetRotation} onSetMaterial={w.onSetMaterial} onSetParameters={w.onSetParameters}
          onUpdateCabinetRun={w.onUpdateCabinetRun}
          onSelect={(objectId) => { props.setActiveOpeningId(null); props.setActiveSurfaceId(null); w.onSelect(objectId); }}
          onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
          activeWallId={props.activeWallId}
          onUpdateWall={(wallId, patch) => build.dispatchBuildCommand({ type: "updateWall", wallId, patch })}
          onSetWallMaterial={w.onSetWallMaterial}
          unit={props.readability.unit}
        />
      ) : null}
    </div>
  );
}
