import {
  countResolvedPackageDeckViews,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { useWorkspacePlanImport } from "../../hooks/useWorkspacePlanImport";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LivingRoomPlanImportOverlays } from "./LivingRoomPlanImportOverlays";
import { LivingRoomPlanWorkspaceCanvas } from "./LivingRoomPlanWorkspaceCanvas";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanWorkspaceRail } from "./LivingRoomPlanWorkspaceRail";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import { inspectPlanTarget } from "./planInspectTarget";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { cabinetProjectFromInteriorProject } from "../../domain/interiorProject";
import { buildDesignHierarchy, type DesignHierarchyNode } from "../../domain/studio/designHierarchy";
import { attachManufacturingParts } from "../../domain/studio/manufacturingTree";
import { partPickForCutlistKey, partPickForMesh } from "../../domain/studio/partPick";
import type { ViewportObjectFilter } from "../../domain/studio/viewportVisibility";
import { DesignHierarchyPanel } from "../studio/DesignHierarchyPanel";
import { DesignWorkspaceFooter } from "../studio/DesignWorkspaceFooter";
import { InteriorProjectTools } from "./InteriorProjectTools";

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
  const [viewportFilter, setViewportFilter] = useState<ViewportObjectFilter>({
    isolatedObjectId: null,
    hiddenObjectIds: [],
  });
  const onViewportVisibility = useCallback((filter: ViewportObjectFilter) => {
    setViewportFilter(filter);
  }, []);
  const hierarchy = useMemo(() => {
    const base = buildDesignHierarchy(project);
    const engineering = cabinetProjectFromInteriorProject(project);
    const bounds = room
      ? { widthMm: room.dimensions.widthMm, depthMm: room.dimensions.depthMm, heightMm: room.dimensions.heightMm }
      : null;
    return {
      nodes: attachManufacturingParts(base, engineering.project.cabinets, bounds),
      cabinets: engineering.project.cabinets,
    };
  }, [project, room]);
  const partSelection = partPickForCutlistKey(hierarchy.cabinets, props.selectedCutlistKey ?? null);
  function selectHierarchyNode(node: DesignHierarchyNode) {
    props.onSelectCutlistKey?.(node.cutlistKey ?? null);
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
    <InteriorProjectTools
      project={project}
      onPatchDocument={(update) => w.onPatchDocument(update, "Project tools updated")}
    />
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanWorkspaceRail {...props} onImportUnderlay={planImport.onImportUnderlay} />
      ) : null}
      <DesignHierarchyPanel
        nodes={hierarchy.nodes}
        selectedIds={w.selectedIds}
        selectedCutlistKey={props.selectedCutlistKey ?? null}
        activeWallId={props.activeWallId}
        activeOpeningId={props.activeOpeningId}
        onSelectNode={selectHierarchyNode}
        onFocus={() => props.onFitSelection?.()}
        onViewportVisibility={onViewportVisibility}
        activeRoomId={room?.id ?? null}
        projectId={project.id}
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
        partSelection={partSelection}
        viewportFilter={viewportFilter}
        onPickPrimitive={(objectId, geometryName) => {
          const pick = partPickForMesh(hierarchy.cabinets, objectId, geometryName);
          props.onSelectCutlistKey?.(pick?.cutlistKey ?? null);
        }}
      />
      <LivingRoomPlanWorkspaceInspector body={{ ...props, partSelection }} activeObject={activeObject} transformPreview={modelTransformPreview} />
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
