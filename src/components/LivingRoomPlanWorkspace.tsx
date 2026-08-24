import { useEffect, useMemo, useState } from "react";
import {
  LIVING_ROOM_CATALOG,
  getLivingRoomPlanUnderlay,
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
  const [plannerMode, setPlannerMode] = useState<PlannerMode>("design");
  const [studioPanel, setStudioPanel] = useState<StudioPanel>("cabinets");
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [importError, setImportError] = useState("");
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [activeOpeningId, setActiveOpeningId] = useState<string | null>(null);
  const [renderResults, setRenderResults] = useState<{
    latest: LivingRoomRenderResult | null;
    previous: LivingRoomRenderResult | null;
  }>({ latest: null, previous: null });
  const millwork = useMillworkSchedule(props.project);
  const activeObject = props.selectedObjects[0] ?? null;
  const room = props.project?.rooms.find((item) => item.id === props.project?.activeRoomId);
  const underlay = props.project ? getLivingRoomPlanUnderlay(props.project) : null;
  useEffect(() => {
    if (!props.project) return;
    setActiveWallId((current) => props.project!.walls.some((wall) => wall.id === current) ? current : props.project!.walls[0]?.id ?? null);
    setActiveOpeningId((current) => props.project!.openings.some((opening) => opening.id === current) ? current : null);
  }, [props.project]);
  const assetCategories = useMemo(
    () => ["all", ...new Set(LIVING_ROOM_CATALOG.map((item) => item.category))],
    [],
  );

  useLivingRoomPlanHotkeys({
    projectHomeOpen: props.projectHomeOpen,
    snapSizeMm,
    onView: setWorkspaceView,
    onDuplicate: props.onDuplicate,
    onDelete: props.onDelete,
    onRotateSelection: props.onRotateSelection,
    onNudge: props.onNudge,
  });

  useEffect(() => {
    setRenderResults({ latest: null, previous: null });
  }, [props.project?.id]);

  const header = (
    <InteriorsProductHeader
      projectName={props.project?.name ?? null}
      workspaceView={workspaceView}
      plannerMode={plannerMode}
      isDirty={props.isDirty}
      canUndo={props.canUndo}
      canRedo={props.canRedo}
      onProject={props.onOpenProjectHome}
      onView={setWorkspaceView}
      onPlannerMode={(mode) => {
        setPlannerMode(mode);
        if (mode === "project") {
          props.onOpenProjectHome();
          return;
        }
        if (mode === "render") {
          setWorkspaceView("render");
          return;
        }
        setWorkspaceView("plan");
        setStudioPanel(mode === "build" ? "build" : "cabinets");
      }}
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
        {header}
        <div className="lr-empty-workspace">
          <LivingRoomHomeFromWorkspace workspace={props} open hasCurrentProject={false} />
        </div>
      </section>
    );
  }

  return (
    <section className="lr-plan-shell lr-product-shell lr-product-shell-v2">
      {header}
      <div className={`lr-workspace-body is-${workspaceView}`}>
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
            onSelect={(objectId) => props.onSelect(objectId)}
            onSetPlanUnderlay={props.onSetPlanUnderlay}
            onRoomDimensions={props.onRoomDimensions}
            activeWallId={activeWallId}
            activeOpeningId={activeOpeningId}
            onActiveWall={setActiveWallId}
            onActiveOpening={(openingId) => {
              setActiveOpeningId(openingId);
              const opening = props.project!.openings.find((item) => item.id === openingId);
              if (opening) setActiveWallId(opening.wallId);
            }}
            onAddOpening={(wallId, kind) => {
              props.onAddOpening(wallId, kind);
              setActiveWallId(wallId);
            }}
            onUpdateOpening={props.onUpdateOpening}
            onDeleteOpening={(openingId) => {
              props.onDeleteOpening(openingId);
              setActiveOpeningId(null);
            }}
            v2BuildMode={plannerMode === "build"}
            v2DesignMode={plannerMode === "design"}
            onImportUnderlay={async (file) => {
              if (!file) return;
              setImportError("");
              try {
                props.onSetPlanUnderlay(await imageFileToUnderlay(file, room.dimensions.widthMm));
                setStudioPanel("build");
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
          onSelect={props.onSelect}
          onMove={props.onMove}
          onResize={props.onResize}
          activeWallId={activeWallId}
          activeOpeningId={activeOpeningId}
          onSelectWall={setActiveWallId}
          onSelectOpening={(openingId) => {
            setActiveOpeningId(openingId);
            const opening = props.project!.openings.find((item) => item.id === openingId);
            if (opening) setActiveWallId(opening.wallId);
          }}
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
            onSelect={(objectId) => props.onSelect(objectId)}
          />
        ) : null}
      </div>
    </section>
  );
}
