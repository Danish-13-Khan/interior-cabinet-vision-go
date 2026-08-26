import { useEffect, useMemo, useRef, useState } from "react";
import {
  LIVING_ROOM_CATALOG,
  applyBuildCommand,
  createBuildCommandState,
  getLivingRoomPlanUnderlay,
  getOpeningCatalogItem,
  type BuildCommand,
  type BuildTool,
  type LivingRoomRenderResult,
} from "../domain/livingRoom";
import { imageFileToUnderlay } from "../domain/livingRoom/planUnderlayImport";
import { useLivingRoomPlanHotkeys } from "../hooks/useLivingRoomPlanHotkeys";
import { useMillworkSchedule } from "../hooks/useMillworkSchedule";
import { InteriorsProductHeader } from "./livingRoomPlan/InteriorsProductHeader";
import { LivingRoomPlanCatalogRail } from "./livingRoomPlan/LivingRoomPlanCatalogRail";
import { LivingRoomAdvancedPanel } from "./livingRoomPlan/LivingRoomAdvancedPanel";
import { LivingRoomHomeFromWorkspace } from "./livingRoomPlan/LivingRoomHomeFromWorkspace";
import { LivingRoomInspectorPanel } from "./livingRoomPlan/LivingRoomInspectorPanel";
import { LivingRoomPlanStage } from "./livingRoomPlan/LivingRoomPlanStage";
import { PlannerV2ReviewPanel } from "./livingRoomPlan/PlannerV2ReviewPanel";
import { PlannerV2WorkflowSteps } from "./livingRoomPlan/PlannerV2WorkflowSteps";
import type {
  LivingRoomPlanWorkspaceProps,
  LivingRoomWorkspaceView,
  PlannerMode,
  StudioPanel,
} from "./livingRoomPlan/workspaceProps";

export function LivingRoomPlanWorkspace(props: LivingRoomPlanWorkspaceProps) {
  const [snapSizeMm, setSnapSizeMm] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [workspaceView, setWorkspaceView] = useState<LivingRoomWorkspaceView>("plan");
  const [plannerMode, setPlannerMode] = useState<PlannerMode>("project");
  const [studioPanel, setStudioPanel] = useState<StudioPanel>("cabinets");
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [importError, setImportError] = useState("");
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [activeOpeningId, setActiveOpeningId] = useState<string | null>(null);
  const [pendingOpeningWallId, setPendingOpeningWallId] = useState<string | null>(null);
  const [pendingPartition, setPendingPartition] = useState(false);
  const [buildCommandState, setBuildCommandState] = useState(createBuildCommandState);
  const buildCommandStateRef = useRef(buildCommandState);
  const [openingCatalogItemId, setOpeningCatalogItemId] = useState("opening:door-single");
  const underlayPickerRef = useRef<(() => void) | null>(null);
  const [renderResults, setRenderResults] = useState<{
    latest: LivingRoomRenderResult | null;
    previous: LivingRoomRenderResult | null;
  }>({ latest: null, previous: null });
  const millwork = useMillworkSchedule(props.project);
  const activeObject = props.selectedObjects[0] ?? null;
  const activeOpening = props.project?.openings.find((opening) => opening.id === activeOpeningId) ?? null;
  const room = props.project?.rooms.find((item) => item.id === props.project?.activeRoomId);
  const underlay = props.project ? getLivingRoomPlanUnderlay(props.project) : null;
  const activeBuildTool = buildCommandState.activeTool;
  buildCommandStateRef.current = buildCommandState;

  const buildHandlersRef = useRef({
    resizeRoom: props.onRoomDimensions,
    createWall: () => {
      setPendingPartition(true);
      props.onAddPartitionWall();
    },
    placeOpening: (wallId: string, kind: "door" | "window", offsetMm?: number, catalogItemId?: string) => {
      setPendingOpeningWallId(wallId);
      props.onAddOpening(wallId, kind, offsetMm, catalogItemId);
      setActiveWallId(wallId);
    },
    requestUnderlayUpload: () => underlayPickerRef.current?.(),
    updateOpening: props.onUpdateOpening,
    deleteOpening: props.onDeleteOpening,
  });
  buildHandlersRef.current = {
    resizeRoom: props.onRoomDimensions,
    createWall: () => {
      setPendingPartition(true);
      props.onAddPartitionWall();
    },
    placeOpening: (wallId, kind, offsetMm, catalogItemId) => {
      setPendingOpeningWallId(wallId);
      props.onAddOpening(wallId, kind, offsetMm, catalogItemId);
      setActiveWallId(wallId);
    },
    requestUnderlayUpload: () => underlayPickerRef.current?.(),
    updateOpening: props.onUpdateOpening,
    deleteOpening: props.onDeleteOpening,
  };

  function dispatchBuildCommand(command: BuildCommand) {
    const next = applyBuildCommand(buildCommandStateRef.current, command, buildHandlersRef.current);
    buildCommandStateRef.current = next;
    setBuildCommandState(next);
  }

  useEffect(() => {
    if (!props.project) return;
    setActiveWallId((current) => props.project!.walls.some((wall) => wall.id === current) ? current : props.project!.walls[0]?.id ?? null);
    setActiveOpeningId((current) => props.project!.openings.some((opening) => opening.id === current) ? current : null);
  }, [props.project]);

  useEffect(() => {
    const cancelTool = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setBuildCommandState((current) =>
        applyBuildCommand(current, { type: "cancelDraft" }, buildHandlersRef.current),
      );
    };
    window.addEventListener("keydown", cancelTool);
    return () => window.removeEventListener("keydown", cancelTool);
  }, []);

  useEffect(() => {
    if (!props.project || !pendingOpeningWallId) return;
    const opening = [...props.project.openings].reverse().find((item) => item.wallId === pendingOpeningWallId);
    if (!opening) return;
    setActiveWallId(opening.wallId);
    setActiveOpeningId(opening.id);
    setPendingOpeningWallId(null);
  }, [pendingOpeningWallId, props.project]);

  useEffect(() => {
    if (!props.project || !pendingPartition) return;
    const wall = [...props.project.walls].reverse().find((item) => item.extensions?.isPartition === true);
    if (!wall) return;
    setActiveWallId(wall.id);
    setPendingPartition(false);
  }, [pendingPartition, props.project]);
  const assetCategories = useMemo(
    () => ["all", ...new Set(LIVING_ROOM_CATALOG.map((item) => item.category))],
    [],
  );

  useLivingRoomPlanHotkeys({
    projectHomeOpen: props.projectHomeOpen,
    snapSizeMm,
    onView: changeWorkspaceView,
    onDuplicate: props.onDuplicate,
    onDelete: props.onDelete,
    onRotateSelection: props.onRotateSelection,
    onNudge: props.onNudge,
  });

  useEffect(() => {
    setRenderResults({ latest: null, previous: null });
  }, [props.project?.id]);

  useEffect(() => {
    if (props.project && !props.projectHomeOpen && plannerMode === "project") {
      setPlannerMode("build");
    }
  }, [plannerMode, props.project, props.projectHomeOpen]);

  function changePlannerMode(mode: PlannerMode) {
    setPlannerMode(mode);
    if (mode === "project") {
      props.onOpenProjectHome();
      return;
    }
    props.onCloseProjectHome();
    if (mode === "render") {
      setWorkspaceView("render");
      return;
    }
    setWorkspaceView("plan");
    setStudioPanel(mode === "build" ? "build" : "cabinets");
    if (mode === "build") dispatchBuildCommand({ type: "beginDraft", tool: "select" });
  }

  function selectBuildTool(tool: BuildTool) {
    if (tool === "place-door" && getOpeningCatalogItem(openingCatalogItemId).kind !== "door") setOpeningCatalogItemId("opening:door-single");
    if (tool === "place-window" && getOpeningCatalogItem(openingCatalogItemId).kind !== "window") setOpeningCatalogItemId("opening:window-fixed");
    dispatchBuildCommand({ type: "beginDraft", tool });
  }

  function changeWorkspaceView(view: LivingRoomWorkspaceView) {
    if (plannerMode === "render" && view !== "render") {
      setPlannerMode("design");
      props.onCloseProjectHome();
      setStudioPanel("cabinets");
    }
    setWorkspaceView(view);
  }

  const header = (
    <InteriorsProductHeader
      projectName={props.project?.name ?? null}
      workspaceView={workspaceView}
      plannerMode={plannerMode}
      isDirty={props.isDirty}
      canUndo={props.canUndo}
      canRedo={props.canRedo}
      onProject={() => changePlannerMode("project")}
      onView={changeWorkspaceView}
      onPlannerMode={changePlannerMode}
      onOpen={props.onOpenProject}
      onSave={props.onSaveProject}
      onExport={props.onExportProject}
      onUndo={props.onUndo}
      onRedo={props.onRedo}
      onWorkbenchModeChange={props.onWorkbenchModeChange}
    />
  );

  if (!props.project || !room) {
    return (
      <section className="lr-plan-shell lr-product-shell lr-product-shell-v2">
        <PlannerV2WorkflowSteps mode={plannerMode} onChange={setPlannerMode} hasProject={false} />
        {header}
        <div className="lr-empty-workspace">
          <LivingRoomHomeFromWorkspace workspace={props} open hasCurrentProject={false} />
        </div>
      </section>
    );
  }

  return (
    <section className="lr-plan-shell lr-product-shell lr-product-shell-v2">
      <PlannerV2WorkflowSteps mode={plannerMode} hasProject onChange={changePlannerMode} />
      {header}
      <div className={`lr-workspace-body is-${workspaceView} is-planner-${plannerMode}`}>
        <LivingRoomHomeFromWorkspace
          workspace={props}
          open={props.projectHomeOpen}
          hasCurrentProject
        />
        {workspaceView === "plan" && studioPanel === "advanced" ? (
          <LivingRoomAdvancedPanel
            project={props.project}
            underlay={underlay}
            onRoomDimensions={props.onRoomDimensions}
            onAddCatalogObject={props.onAddCatalogObject}
            onUpdateState={props.onUpdateAdvancedStudio}
          />
        ) : workspaceView === "plan" ? (
          <LivingRoomPlanCatalogRail
            widthPx={props.toolRailWidthPx}
            toolRailVisible={props.toolRailVisible}
            studioPanel={studioPanel}
            onStudioPanel={setStudioPanel}
            project={props.project}
            roomName={room.name}
            selectedIds={props.selectedIds}
            assetQuery={assetQuery}
            assetCategory={assetCategory}
            assetCategories={assetCategories}
            underlay={underlay}
            importError={importError}
            onAssetQuery={setAssetQuery}
            onAssetCategory={setAssetCategory}
            onAddCatalogObject={props.onAddCatalogObject}
            onAddImportedAsset={props.onAddImportedAsset}
            onSetFloorMaterial={props.onSetFloorMaterial}
            onSetWallMaterial={props.onSetWallMaterial}
            onSetObjectMaterial={props.onSetMaterial}
            onSetLayerVisibility={props.onSetLayerVisibility}
            onSelect={(objectId) => { setActiveOpeningId(null); props.onSelect(objectId); }}
            onSetPlanUnderlay={props.onSetPlanUnderlay}
            onRoomDimensions={(dimensions) => dispatchBuildCommand({ type: "resizeRoom", dimensions })}
            onAddPartitionWall={() => dispatchBuildCommand({ type: "createWall" })}
            activeWallId={activeWallId}
            activeOpeningId={activeOpeningId}
            onActiveWall={setActiveWallId}
            onActiveOpening={(openingId) => {
              setActiveOpeningId(openingId);
              const opening = props.project!.openings.find((item) => item.id === openingId);
              if (opening) setActiveWallId(opening.wallId);
            }}
            onAddOpening={(wallId, kind) => dispatchBuildCommand({ type: "placeOpening", wallId, kind, catalogItemId: openingCatalogItemId })}
            onUpdateOpening={(openingId, patch) => dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
            onDeleteOpening={(openingId) => {
              dispatchBuildCommand({ type: "deleteOpening", openingId });
              setActiveOpeningId(null);
            }}
            v2BuildMode={plannerMode === "build"}
            v2DesignMode={plannerMode === "design"}
            activeBuildTool={activeBuildTool}
            onBuildTool={selectBuildTool}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            openingCatalogItemId={openingCatalogItemId}
            onOpeningCatalogItem={setOpeningCatalogItemId}
            onRegisterUnderlayPicker={(openPicker) => {
              underlayPickerRef.current = openPicker;
            }}
            onImportUnderlay={async (file) => {
              if (!file) return;
              setImportError("");
              try {
                props.onSetPlanUnderlay(await imageFileToUnderlay(file, room.dimensions.widthMm));
                setStudioPanel("build");
                dispatchBuildCommand({ type: "commitDraft" });
              } catch (error) {
                setImportError(error instanceof Error ? error.message : "Plan import failed.");
              }
            }}
          />
        ) : null}
        {plannerMode === "render" ? (
          <PlannerV2ReviewPanel
            schedule={millwork.schedule}
            issues={props.issues}
            busy={millwork.busy}
            status={millwork.status}
            onCsv={() => void millwork.exportSchedule("schedule-csv")}
            onPdf={() => void millwork.exportSchedule("pdf")}
          />
        ) : null}
        <LivingRoomPlanStage
          project={props.project}
          workspaceView={workspaceView}
          selectedIds={props.selectedIds}
          issues={props.issues}
          snapSizeMm={snapSizeMm}
          showGrid={showGrid}
          canUndo={props.canUndo}
          canRedo={props.canRedo}
          hasSelection={Boolean(activeObject)}
          millworkCount={millwork.workflow?.millworkCount ?? 0}
          millworkReady={millwork.workflow?.readyToExport ?? false}
          exportBusy={millwork.busy}
          exportStatus={millwork.status}
          autosaveState={props.autosaveState}
          lastAutosavedAt={props.lastAutosavedAt}
          latestRender={renderResults.latest}
          previousRender={renderResults.previous}
          onShowGrid={setShowGrid}
          onSnapSize={setSnapSizeMm}
          onSelect={(objectId, additive) => { setActiveOpeningId(null); props.onSelect(objectId, additive); }}
          onMove={props.onMove}
          onResize={props.onResize}
          activeWallId={activeWallId}
          activeOpeningId={activeOpeningId}
          onSelectWall={(wallId) => { setActiveOpeningId(null); setActiveWallId(wallId); }}
          onSelectOpening={(openingId) => {
            setActiveOpeningId(openingId);
            const opening = props.project!.openings.find((item) => item.id === openingId);
            if (opening) setActiveWallId(opening.wallId);
          }}
          onMoveOpening={(openingId, offsetMm) => dispatchBuildCommand({ type: "moveOpening", openingId, offsetMm })}
          onResizeOpening={(openingId, widthMm, offsetMm) => dispatchBuildCommand({ type: "resizeOpening", openingId, widthMm, offsetMm })}
          activeBuildTool={activeBuildTool}
          openingCatalogItemId={openingCatalogItemId}
          onPlaceOpening={(wallId, kind, offsetMm) => dispatchBuildCommand({ type: "placeOpening", wallId, kind, offsetMm, catalogItemId: openingCatalogItemId })}
          onSetRotation={props.onSetRotation}
          onSetParameters={props.onSetParameters}
          onApplyStyle={props.onApplyStyle}
          onUndo={props.onUndo}
          onRedo={props.onRedo}
          onDuplicate={props.onDuplicate}
          onDelete={props.onDelete}
          onRotateSelection={props.onRotateSelection}
          onAlign={props.onAlign}
          onCreateCabinetRun={() => activeWallId && props.onCreateCabinetRun(activeWallId)}
          onRenderSettingsChange={props.onRenderSettingsChange}
          onLightingChange={props.onLightingChange}
          onRenderBrowserThumbnail={props.onRenderBrowserThumbnail}
          onRendered={(result) => setRenderResults((current) => ({
            latest: result,
            previous: current.latest,
          }))}
          onExportScheduleCsv={() => void millwork.exportSchedule("schedule-csv")}
          onExportCutlistCsv={() => void millwork.exportSchedule("cutlist-csv")}
          onExportPdf={() => void millwork.exportSchedule("pdf")}
          v2BuildMode={plannerMode === "build"}
          v2ReviewMode={workspaceView === "model"}
        />
        {props.inspectorVisible && workspaceView !== "render" ? (
          <LivingRoomInspectorPanel
            mode={workspaceView}
            widthPx={props.inspectorWidthPx}
            project={props.project}
            room={room}
            activeObject={activeObject}
            activeOpening={activeOpening}
            selectedCount={props.selectedIds.length}
            issues={props.issues}
            millworkSchedule={millwork.schedule}
            millworkWorkflow={millwork.workflow}
            productionReport={millwork.productionReport}
            millworkExportedAt={millwork.exportedAt}
            onRoomDimensions={props.onRoomDimensions}
            onMove={props.onMove}
            onResize={props.onResize}
            onSetRotation={props.onSetRotation}
            onSetMaterial={props.onSetMaterial}
            onSetParameters={props.onSetParameters}
            onSelect={(objectId) => { setActiveOpeningId(null); props.onSelect(objectId); }}
            onUpdateOpening={(openingId, patch) => dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
          />
        ) : null}
      </div>
    </section>
  );
}
