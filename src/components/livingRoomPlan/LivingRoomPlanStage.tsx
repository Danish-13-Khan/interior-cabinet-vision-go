import { LivingRoomModelView } from "../LivingRoomModelView";
import { LivingRoomPlanView } from "../LivingRoomPlanView";
import { LivingRoomRenderStudio } from "../LivingRoomRenderStudio";
import { InteriorsClientCaptureView } from "./InteriorsClientCaptureView";
import { PlanStageAuthoringChrome } from "./PlanStageAuthoringChrome";
import { PlanStageStatus } from "./PlanStageStatus";
import type { LivingRoomPlanStageProps } from "./planStageProps";

export function LivingRoomPlanStage(props: LivingRoomPlanStageProps) {
  return (
    <div className="lr-plan-center">
      <PlanStageAuthoringChrome {...props} />
      <div className="lr-plan-canvas" data-testid="lr-plan-canvas">
        {props.workspaceView === "plan" ? (
          <LivingRoomPlanView
            project={props.project} selectedIds={props.selectedIds} issues={props.issues}
            snapSizeMm={props.snapSizeMm} showGrid={props.showGrid}
            onSelect={props.onSelect} onMove={props.onMove} onResize={props.onResize}
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
