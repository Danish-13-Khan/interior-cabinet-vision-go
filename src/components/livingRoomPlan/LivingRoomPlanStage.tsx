import { LivingRoomModelView } from "../LivingRoomModelView";
import { LivingRoomPlanView } from "../LivingRoomPlanView";
import { LivingRoomRenderStudio } from "../LivingRoomRenderStudio";
import { setWallVisible, flipPanelWallSide, type ContextualRailCommandId } from "../../domain/livingRoom";
import {
  ContextualCommandRail,
  contextualRailKindFromStage,
} from "./ContextualCommandRail";
import { InteriorsClientCaptureView } from "./InteriorsClientCaptureView";
import { PlanStageAuthoringChrome } from "./PlanStageAuthoringChrome";
import { PlanStageStatus } from "./PlanStageStatus";
import type { LivingRoomPlanStageProps } from "./planStageProps";

function selectedObjects(props: LivingRoomPlanStageProps) {
  const ids = new Set(props.selectedIds);
  return props.project.objects.filter((object) => ids.has(object.id));
}

function runRailCommand(props: LivingRoomPlanStageProps, id: ContextualRailCommandId) {
  if (id === "select") props.onChromeTool?.("select");
  if (id === "measure") {
    if (props.workspaceView !== "plan") props.onWorkspaceView?.("plan");
    props.onBuildTool?.("measure");
  }
  if (id === "camera") props.onWorkspaceView?.("model");
  if (id === "material") props.onChromeTool?.("material");
  if (id === "add-panel" && props.activeWallId) props.onAddWallPanel?.(props.activeWallId);
  if (id === "hide-wall" && props.activeWallId && props.onPatchDocument) {
    const wallId = props.activeWallId;
    props.onPatchDocument((current) => setWallVisible(current, wallId, false), "Hide wall");
    props.onClearSelection();
  }
  if (id === "rotate") props.onRotateSelection(90);
  if (id === "flip-side" && props.onPatchDocument) {
    const panelId = props.selectedIds[0];
    if (panelId) {
      props.onPatchDocument((current) => flipPanelWallSide(current, panelId), "Flip panel side");
    }
  }
  if (id === "duplicate") props.onDuplicate();
  if (id === "delete") props.onDelete();
}

export function LivingRoomPlanStage(props: LivingRoomPlanStageProps) {
  const showRail = props.workspaceView === "plan" || props.workspaceView === "model";
  const kind = contextualRailKindFromStage({
    activeWallId: props.activeWallId,
    selectedObjects: selectedObjects(props),
  });
  return (
    <div className="lr-plan-center">
      {showRail && !props.presenting ? (
        <ContextualCommandRail
          kind={kind}
          workspaceView={props.workspaceView}
          onCommand={(id) => runRailCommand(props, id)}
        />
      ) : null}
      <PlanStageAuthoringChrome {...props} />
      <div className="lr-plan-canvas" data-testid="lr-plan-canvas">
        {props.workspaceView === "plan" ? (
          <LivingRoomPlanView
            project={props.project} selectedIds={props.selectedIds} issues={props.issues}
            snapSizeMm={props.snapSizeMm} showGrid={props.showGrid}
            onSelect={props.onSelect} onMove={props.onMove} onMovePreview={props.onMovePreview} onDragEnd={props.onDragEnd} onResize={props.onResize}
            activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
            activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={props.surfaceMaterialId}
            onSelectWall={props.onSelectWall} onSelectOpening={props.onSelectOpening}
            onSelectSurface={props.onSelectSurface} onMoveOpening={props.onMoveOpening}
            onResizeOpening={props.onResizeOpening} onMoveNode={props.onMoveNode}
            onTranslateWall={props.onTranslateWall} activeBuildTool={props.activeBuildTool}
            openingCatalogItemId={props.openingCatalogItemId} onPlaceOpening={props.onPlaceOpening}
            onCreateRoom={props.onCreateRoom} onDrawSurface={props.onDrawSurface}
            onDrawWallSegment={props.onDrawWallSegment} onPlaceColumn={props.onPlaceColumn}
            roomPolygonCloseRequest={props.roomPolygonCloseRequest}
            onRoomPolygonPointCount={props.onRoomPolygonPointCount} readability={props.readability}
            onSelectRoom={props.onSelectRoom}
            onSelectMany={props.onSelectMany}
            onSetWallLength={props.onSetWallLength}
            onSetCabinetInlineDims={props.onSetCabinetInlineDims}
            preDropReason={props.preDropReason}
            onRegisterViewControls={props.onRegisterViewControls}
            onSetPlanUnderlay={props.onSetPlanUnderlay}
            onCalibrateComplete={props.onCalibrateComplete}
          />
        ) : props.workspaceView === "model" ? (
          <LivingRoomModelView
            project={props.project} selectedIds={props.selectedIds} snapSizeMm={props.snapSizeMm}
            activeOpeningId={props.activeOpeningId} activeWallId={props.activeWallId} showGrid={props.showGrid}
            onSelect={props.onSelect} onSelectOpening={props.onSelectOpening} onSelectWall={props.onSelectWall}
            onClearSelection={props.onClearSelection} onMove={props.onMove}
            onSetRotation={props.onSetRotation} onApplyStyle={props.onApplyStyle}
            onSetParameters={props.onSetParameters}
            onPatchDocument={props.onPatchDocument}
            presentation={props.presenting}
          />
        ) : props.presenting ? (
          <InteriorsClientCaptureView
            project={props.project}
            latestResult={props.latestRender}
            onRendered={props.onRendered}
            onBrowserThumbnail={props.onRenderBrowserThumbnail}
          />
        ) : (
          <LivingRoomRenderStudio
            project={props.project} latestResult={props.latestRender} previousResult={props.previousRender}
            onRendered={props.onRendered} onSettingsChange={props.onRenderSettingsChange}
            onLightingChange={props.onLightingChange} onBrowserThumbnail={props.onRenderBrowserThumbnail}
            acceptedStillAssets={props.acceptedStillAssets}
            onAcceptedStillAssetsChange={props.onAcceptedStillAssetsChange}
            clientExport={props.clientExport}
            clientPackageBlocked={props.clientPackageBlocked}
          />
        )}
      </div>
      <PlanStageStatus {...props} />
    </div>
  );
}
