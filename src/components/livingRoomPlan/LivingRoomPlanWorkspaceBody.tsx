import {
  countResolvedPackageDeckViews,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { useWorkspacePlanImport } from "../../hooks/useWorkspacePlanImport";
import { useEffect, useMemo, useState } from "react";
import { LivingRoomPlanImportOverlays } from "./LivingRoomPlanImportOverlays";
import { LivingRoomPlanWorkspaceCanvas } from "./LivingRoomPlanWorkspaceCanvas";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanWorkspaceRail } from "./LivingRoomPlanWorkspaceRail";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import { inspectPlanTarget } from "./planInspectTarget";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { buildDesignHierarchy, type DesignHierarchyNode } from "../../domain/studio/designHierarchy";
import { DesignHierarchyPanel } from "../studio/DesignHierarchyPanel";
import { DesignWorkspaceFooter } from "../studio/DesignWorkspaceFooter";

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
  useEffect(() => {
    if (props.workspaceView !== "model") setModelTransformPreview(null);
  }, [props.workspaceView]);
  const hierarchy = useMemo(() => buildDesignHierarchy(project), [project]);
  function selectHierarchyNode(node: DesignHierarchyNode) {
    if (node.kind === "room") {
      w.onActiveRoom(node.roomId);
      inspectPlanTarget(props, { inspectRoom: true });
      return;
    }
    if (node.objectId) {
      inspectPlanTarget(props, { objectId: node.objectId });
      return;
    }
    inspectPlanTarget(props, { wallId: node.wallId, openingId: node.openingId });
  }

  return (
    <div className="studio-design">
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanWorkspaceRail {...props} onImportUnderlay={planImport.onImportUnderlay} />
      ) : null}
      <DesignHierarchyPanel
        nodes={hierarchy}
        selectedIds={w.selectedIds}
        activeWallId={props.activeWallId}
        activeOpeningId={props.activeOpeningId}
        onSelectNode={selectHierarchyNode}
      />
      {props.plannerMode === "render" ? (
        <InteriorsPresentPanel
          proposal={props.proposal}
          handoff={props.handoff}
          onCapture={() => props.onWorkspaceView("render")}
          onReturnToReview={props.onReturnToReview}
        />
      ) : null}
      <LivingRoomPlanWorkspaceCanvas
        {...props}
        activeObject={activeObject}
        clientPackageBlocked={clientPackageBlocked}
        onTransformPreviewChange={setModelTransformPreview}
      />
      <LivingRoomPlanWorkspaceInspector body={props} activeObject={activeObject} transformPreview={modelTransformPreview} />
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
    </div>
    <DesignWorkspaceFooter
      view={props.workspaceView}
      snapSizeMm={props.snapSizeMm}
      showGrid={props.showGrid}
      selectedCount={w.selectedIds.length}
      issues={props.issues}
      onSnapSize={props.onSnapSize}
      onShowGrid={props.onShowGrid}
      onView={props.onWorkspaceView}
      onFitPlan={props.onFitPlan}
      onFitSelection={props.onFitSelection}
      onZoomIn={props.onZoomIn}
      onZoomOut={props.onZoomOut}
    />
    </div>
  );
}
