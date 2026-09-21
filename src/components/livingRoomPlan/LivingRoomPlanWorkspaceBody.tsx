import {
  countResolvedPackageDeckViews,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { useWorkspacePlanImport } from "../../hooks/useWorkspacePlanImport";
import { useEffect, useState } from "react";
import { LivingRoomPlanImportOverlays } from "./LivingRoomPlanImportOverlays";
import { LivingRoomPlanWorkspaceCanvas } from "./LivingRoomPlanWorkspaceCanvas";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanWorkspaceRail } from "./LivingRoomPlanWorkspaceRail";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";

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
    project,
    roomWidthMm: room?.dimensions.widthMm ?? 6200,
    onImportError: props.onImportError,
    onSetPlanUnderlay: w.onSetPlanUnderlay,
    onStudioPanel: props.onStudioPanel,
    onBuildTool: props.onBuildTool,
    onCommitDraft: () => build.dispatchBuildCommand({ type: "commitDraft" }),
    onPatchDocument: w.onPatchDocument,
  });
  useEffect(() => {
    if (props.workspaceView !== "model") setModelTransformPreview(null);
  }, [props.workspaceView]);

  return (
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanWorkspaceRail {...props} onImportUnderlay={planImport.onImportUnderlay} />
      ) : null}
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
        project={project}
        roomWidthMm={room?.dimensions.widthMm ?? 6200}
        dwgFile={planImport.dwgImportFile}
        pdfFile={planImport.pdfImportFile}
        extractDraft={planImport.extractDraft}
        extractDraftKey={planImport.extractDraftKey}
        extractLiveSchema={planImport.extractLiveSchema}
        extractStatus={planImport.extractStatus}
        lastAppliedExtract={planImport.lastAppliedExtract}
        underlayPicker={props.underlayPickerRef.current}
        onCancelDwg={planImport.cancelDwg}
        onConfirmDwg={planImport.confirmDwg}
        onCancelPdf={planImport.cancelPdf}
        onConfirmPdf={planImport.confirmPdf}
        onPdfError={planImport.failPdf}
        onReopenExtract={planImport.reopenExtract}
        onDismissExtractStatus={planImport.dismissExtractStatus}
        onCloseExtract={planImport.closeExtract}
        onApplyExtract={planImport.applyExtract}
        onImportError={props.onImportError}
      />
    </div>
  );
}
