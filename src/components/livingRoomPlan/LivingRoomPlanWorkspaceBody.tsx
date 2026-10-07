import {
  countResolvedPackageDeckViews,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { useWorkspacePlanImport } from "../../hooks/useWorkspacePlanImport";
import { useFloorplanExtractFlow } from "../../hooks/useFloorplanExtractFlow";
import { useEffect, useState } from "react";
import { FloorplanExtractSlot } from "./FloorplanExtractSlot";
import { LivingRoomPlanImportOverlays } from "./LivingRoomPlanImportOverlays";
import { LivingRoomPlanWorkspaceCanvas } from "./LivingRoomPlanWorkspaceCanvas";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanWorkspaceRail } from "./LivingRoomPlanWorkspaceRail";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import { exportCyclesPhotoJob } from "../../platform/cyclesFiles";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { useStudioPanes } from "./useStudioPanes";

export function LivingRoomPlanWorkspaceBody(props: LivingRoomPlanWorkspaceBodyProps) {
  const { workspace: w, project, room, build } = props;
  const activeObject = w.selectedObjects[0] ?? null;
  const readyToExport = props.millwork.workflow?.readyToExport ?? false;
  const clientPackageBlocked = isClientPackageExportBlocked(props.issues, readyToExport, {
    millworkCount: props.millwork.workflow?.millworkCount ?? 0,
    packageDeckCount: countResolvedPackageDeckViews(project),
    acceptedStillCount: props.acceptedStillAssets.length,
    geometryFallbackIds: activeRoomGeometryFallbackIds(project),
  });
  const [modelTransformPreview, setModelTransformPreview] = useState<ModelTransformPreview | null>(null);
  const planImport = useWorkspacePlanImport({
    roomWidthMm: room?.dimensions.widthMm ?? 6200,
    onImportError: props.onImportError,
    onSetPlanUnderlay: w.onSetPlanUnderlay,
    onStudioPanel: props.onStudioPanel,
    onBuildTool: props.onBuildTool,
    onCommitDraft: () => build.dispatchBuildCommand({ type: "commitDraft" }),
  });
  const floorplanExtract = useFloorplanExtractFlow(props.underlay);
  const panes = useStudioPanes({
    catalogWidth: w.toolRailWidthPx,
    inspectorWidth: w.inspectorWidthPx,
    onCatalogWidth: w.onToolRailWidthChange,
    onInspectorWidth: w.onInspectorWidthChange,
  });
  useEffect(() => {
    if (props.workspaceView !== "model") setModelTransformPreview(null);
  }, [props.workspaceView]);

  return (
    <div
      ref={panes.ref}
      className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}${panes.maximized ? ` is-max-${panes.maximized}` : ""}`}
    >
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanWorkspaceRail {...props} onImportUnderlay={planImport.onImportUnderlay}
          floorplanExtract={floorplanExtract.launcher}
          paneMaximized={panes.maximized === "catalog"}
          paneMax={panes.catalogMax}
          onPaneWidth={panes.onCatalogWidth}
          onPaneMaximize={() => panes.toggle("catalog")}
        />
      ) : null}
      {props.plannerMode === "render" ? (
        <InteriorsPresentPanel
          proposal={props.proposal}
          handoff={props.handoff}
          onCapture={() => {
            // Reassert Present before opening capture. Desktop/WebView state can
            // restore the workspace view independently of the planner mode;
            // capture must always resolve to the dedicated client render canvas.
            props.onPresent();
            props.onWorkspaceView("render");
          }}
          onReturnToReview={props.onReturnToReview}
          onExportPhotoJob={() => void exportCyclesPhotoJob(project)}
        />
      ) : null}
      <LivingRoomPlanWorkspaceCanvas
        {...props}
        activeObject={activeObject}
        clientPackageBlocked={clientPackageBlocked}
        onTransformPreviewChange={setModelTransformPreview}
      />
      <LivingRoomPlanWorkspaceInspector
        body={props}
        activeObject={activeObject}
        transformPreview={modelTransformPreview}
        maximized={panes.maximized === "inspector"}
        paneMax={panes.inspectorMax}
        onPaneWidth={panes.onInspectorWidth}
        onPaneMaximize={() => panes.toggle("inspector")}
      />
      <LivingRoomPlanImportOverlays
        roomWidthMm={room?.dimensions.widthMm ?? 6200}
        dwgFile={planImport.dwgImportFile}
        pdfFile={planImport.pdfImportFile}
        onCancelDwg={planImport.cancelDwg}
        onConfirmDwg={planImport.confirmDwg}
        onCancelPdf={planImport.cancelPdf}
        onConfirmPdf={planImport.confirmPdf}
        onPdfError={planImport.failPdf}
      />
      <FloorplanExtractSlot
        draft={floorplanExtract.draft}
        project={project}
        onClose={floorplanExtract.close}
        onApply={(next, status) => w.onPatchDocument(() => next, status)}
      />
    </div>
  );
}
