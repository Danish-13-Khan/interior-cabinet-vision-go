import { useEffect, useMemo, useRef, useState } from "react";
import { LIVING_ROOM_CATALOG, getLivingRoomPlanUnderlay, type LivingRoomRenderResult } from "../domain/livingRoom";
import { useLivingRoomPlanHotkeys } from "../hooks/useLivingRoomPlanHotkeys";
import { useLivingRoomBuildCommands } from "../hooks/useLivingRoomBuildCommands";
import { useMillworkSchedule } from "../hooks/useMillworkSchedule";
import { usePlanReadabilitySettings } from "./livingRoomPlan/usePlanReadabilitySettings";
import { InteriorsProductHeader } from "./livingRoomPlan/InteriorsProductHeader";
import { LivingRoomHomeFromWorkspace } from "./livingRoomPlan/LivingRoomHomeFromWorkspace";
import { LivingRoomPlanWorkspaceBody } from "./livingRoomPlan/LivingRoomPlanWorkspaceBody";
import { PlannerV2WorkflowSteps } from "./livingRoomPlan/PlannerV2WorkflowSteps";
import type { LivingRoomPlanWorkspaceProps, LivingRoomWorkspaceView, PlannerMode, StudioPanel } from "./livingRoomPlan/workspaceProps";

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
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(null);
  const [roomPolygonPointCount, setRoomPolygonPointCount] = useState(0);
  const [roomPolygonCloseRequest, setRoomPolygonCloseRequest] = useState(0);
  const underlayPickerRef = useRef<(() => void) | null>(null);
  const [renderResults, setRenderResults] = useState<{ latest: LivingRoomRenderResult | null; previous: LivingRoomRenderResult | null }>({ latest: null, previous: null });
  const millwork = useMillworkSchedule(props.project);
  const readability = usePlanReadabilitySettings();
  const activeOpening = props.project?.openings.find((opening) => opening.id === activeOpeningId) ?? null;
  const room = props.project?.rooms.find((item) => item.id === props.project?.activeRoomId);
  const underlay = props.project ? getLivingRoomPlanUnderlay(props.project) : null;
  const build = useLivingRoomBuildCommands({
    project: props.project, underlayPickerRef, setActiveWallId, setActiveOpeningId, setActiveSurfaceId,
    onRoomDimensions: props.onRoomDimensions, onAddPartitionWall: props.onAddPartitionWall,
    onCreateRoom: props.onCreateRoom, onDrawWallSegment: props.onDrawWallSegment,
    onDrawSurface: props.onDrawSurface, onUpdateSurface: props.onUpdateSurface,
    onDeleteSurface: props.onDeleteSurface, onPlaceColumn: props.onPlaceColumn,
    onSplitWall: props.onSplitWall, onDeleteWall: props.onDeleteWall, onUpdateWall: props.onUpdateWall,
    onJoinCoincidentNodes: props.onJoinCoincidentNodes, onMoveNode: props.onMoveNode,
    onTranslateWall: props.onTranslateWall, onAddOpening: props.onAddOpening,
    onUpdateOpening: props.onUpdateOpening, onDeleteOpening: props.onDeleteOpening,
  });
  const activeBuildTool = build.buildCommandState.activeTool;
  const assetCategories = useMemo(() => ["all", ...new Set(LIVING_ROOM_CATALOG.map((item) => item.category))], []);

  useEffect(() => {
    if (!props.project) return;
    setActiveWallId((current) => props.project!.walls.some((wall) => wall.id === current) ? current : props.project!.walls[0]?.id ?? null);
    setActiveOpeningId((current) => props.project!.openings.some((opening) => opening.id === current) ? current : null);
  }, [props.project]);

  useLivingRoomPlanHotkeys({
    projectHomeOpen: props.projectHomeOpen, snapSizeMm, onView: changeWorkspaceView,
    onDuplicate: props.onDuplicate, onDelete: props.onDelete,
    onRotateSelection: props.onRotateSelection, onNudge: props.onNudge,
  });

  useEffect(() => { setRenderResults({ latest: null, previous: null }); }, [props.project?.id]);
  useEffect(() => {
    if (props.project && !props.projectHomeOpen && plannerMode === "project") setPlannerMode("build");
  }, [plannerMode, props.project, props.projectHomeOpen]);

  function changePlannerMode(mode: PlannerMode) {
    setPlannerMode(mode);
    if (mode === "project") { props.onOpenProjectHome(); return; }
    props.onCloseProjectHome();
    if (mode === "render") { setWorkspaceView("render"); return; }
    setWorkspaceView("plan");
    setStudioPanel(mode === "build" ? "build" : "cabinets");
    if (mode === "build") build.dispatchBuildCommand({ type: "beginDraft", tool: "select" });
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
    <InteriorsProductHeader projectName={props.project?.name ?? null} workspaceView={workspaceView} plannerMode={plannerMode}
      isDirty={props.isDirty} canUndo={props.canUndo} canRedo={props.canRedo}
      onProject={() => changePlannerMode("project")} onView={changeWorkspaceView} onPlannerMode={changePlannerMode}
      onOpen={props.onOpenProject} onSave={props.onSaveProject} onExport={props.onExportProject}
      onUndo={props.onUndo} onRedo={props.onRedo} onWorkbenchModeChange={props.onWorkbenchModeChange} />
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
      <LivingRoomPlanWorkspaceBody
        workspace={props} project={props.project} room={room} underlay={underlay}
        workspaceView={workspaceView} plannerMode={plannerMode} studioPanel={studioPanel}
        onStudioPanel={setStudioPanel} assetQuery={assetQuery} assetCategory={assetCategory}
        assetCategories={assetCategories} importError={importError} onAssetQuery={setAssetQuery}
        onAssetCategory={setAssetCategory} onImportError={setImportError}
        snapSizeMm={snapSizeMm} showGrid={showGrid} onShowGrid={setShowGrid} onSnapSize={setSnapSizeMm}
        activeWallId={activeWallId} activeOpeningId={activeOpeningId} activeOpening={activeOpening}
        activeSurfaceId={activeSurfaceId} setActiveSurfaceId={setActiveSurfaceId}
        setActiveWallId={setActiveWallId} setActiveOpeningId={setActiveOpeningId}
        roomPolygonPointCount={roomPolygonPointCount} roomPolygonCloseRequest={roomPolygonCloseRequest}
        onRoomPolygonPointCount={setRoomPolygonPointCount}
        onRoomPolygonCloseRequest={() => setRoomPolygonCloseRequest((count) => count + 1)}
        renderResults={renderResults}
        onRenderResults={(result) => setRenderResults((current) => ({ latest: result, previous: current.latest }))}
        build={build} activeBuildTool={activeBuildTool} onBuildTool={build.selectBuildTool}
        underlayPickerRef={underlayPickerRef} millwork={millwork} issues={props.issues}
        readability={readability.settings} onReadability={readability.update}
      />
    </section>
  );
}
