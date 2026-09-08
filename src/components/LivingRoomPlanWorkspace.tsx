import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIVING_ROOM_CATALOG, getLivingRoomPlanUnderlay, readProposalCommercial, type LivingRoomRenderResult } from "../domain/livingRoom";
import { interiorsJobStatusLabel } from "../domain/desktopUx";
import { nextSelectableObjectId } from "../domain/livingRoom/objectSelection";
import { useClientPresentationExport } from "../hooks/useClientPresentationExport";
import { useLivingRoomPlanHotkeys } from "../hooks/useLivingRoomPlanHotkeys";
import { useLivingRoomBuildCommands } from "../hooks/useLivingRoomBuildCommands";
import { useMillworkSchedule } from "../hooks/useMillworkSchedule";
import { useProposalWorkflow } from "../hooks/useProposalWorkflow";
import { useEngineeringHandoff } from "../hooks/useEngineeringHandoff";
import { useInteriorsWorkspaceChrome } from "../hooks/useInteriorsWorkspaceChrome";
import { useInteriorsUiMode } from "../hooks/useInteriorsUiMode";
import type { AcceptedStillAsset } from "../hooks/selectPackageAcceptedStillAssets";
import { usePlanReadabilitySettings } from "./livingRoomPlan/usePlanReadabilitySettings";
import { InteriorsWorkspaceHeader } from "./livingRoomPlan/InteriorsWorkspaceHeader";
import { LivingRoomHomeFromWorkspace } from "./livingRoomPlan/LivingRoomHomeFromWorkspace";
import { LivingRoomPlanWorkspaceBody } from "./livingRoomPlan/LivingRoomPlanWorkspaceBody";
import { useInteriorsProjectsFixtures } from "./livingRoomPlan/InteriorsProjectsFixtures";
import type { LivingRoomPlanWorkspaceProps } from "./livingRoomPlan/workspaceProps";

export function LivingRoomPlanWorkspace(props: LivingRoomPlanWorkspaceProps) {
  const ui = useInteriorsUiMode();
  const [snapSizeMm, setSnapSizeMm] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [importError, setImportError] = useState("");
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [activeOpeningId, setActiveOpeningId] = useState<string | null>(null);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(null);
  const [inspectRoom, setInspectRoom] = useState(false);
  const [roomPolygonPointCount, setRoomPolygonPointCount] = useState(0);
  const [roomPolygonCloseRequest, setRoomPolygonCloseRequest] = useState(0);
  const underlayPickerRef = useRef<(() => void) | null>(null);
  const viewControlsRef = useRef<{ fitPlan: () => void; fitSelection: () => void } | null>(null);
  const registerViewControls = useCallback((controls: { fitPlan: () => void; fitSelection: () => void } | null) => {
    viewControlsRef.current = controls;
  }, []);
  const [renderResults, setRenderResults] = useState<{ latest: LivingRoomRenderResult | null; previous: LivingRoomRenderResult | null }>({ latest: null, previous: null });
  const [acceptedStillAssets, setAcceptedStillAssets] = useState<AcceptedStillAsset[]>([]);
  const millwork = useMillworkSchedule(props.project);
  const clientExport = useClientPresentationExport();
  const proposal = useProposalWorkflow({
    project: props.project, issues: props.issues, onPatchDocument: props.onPatchDocument,
    latestRender: renderResults.latest, acceptedStills: acceptedStillAssets,
  });
  const handoff = useEngineeringHandoff({
    project: props.project, selectedInteriorObjectIds: props.selectedIds,
    onPatchDocument: props.onPatchDocument, onEnterEngineering: props.onEnterEngineering,
  });
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
  const chrome = useInteriorsWorkspaceChrome({
    project: props.project, projectHomeOpen: props.projectHomeOpen,
    onOpenProjectHome: props.onOpenProjectHome, onCloseProjectHome: props.onCloseProjectHome,
    selectBuildTool: build.selectBuildTool,
  });
  useInteriorsProjectsFixtures({
    enabled: true,
    onOpenDemo: () => { props.onDiscardRecovery(); props.onOpenDemo(); },
    onOpenGoldenRun: () => { props.onDiscardRecovery(); props.onOpenGoldenRun(); },
    onOpenRenderStudio: chrome.showRenderStudio,
  });
  const job = props.project ? readProposalCommercial(props.project).job : null;
  const assetCategories = useMemo(() => ["all", ...new Set(LIVING_ROOM_CATALOG.map((item) => item.category))], []);

  useEffect(() => {
    props.onClearPreDropReason?.();
    // Clear stale pre-drop copy when leaving the gesture context (tool / chrome changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional on tool identity only
  }, [build.buildCommandState.activeTool, chrome.chromeTool, chrome.plannerMode]);

  useEffect(() => {
    if (!props.project) return;
    setActiveWallId((current) => props.project!.walls.some((wall) => wall.id === current) ? current : null);
    setActiveOpeningId((current) => props.project!.openings.some((opening) => opening.id === current) ? current : null);
    setActiveSurfaceId((current) => props.project!.surfaces.some((surface) => surface.id === current) ? current : null);
  }, [props.project]);
  useEffect(() => {
    if (activeWallId || activeOpeningId || activeSurfaceId) setInspectRoom(false);
  }, [activeWallId, activeOpeningId, activeSurfaceId]);
  useLivingRoomPlanHotkeys({
    projectHomeOpen: props.projectHomeOpen, snapSizeMm, workspaceView: chrome.workspaceView,
    canUndo: props.canUndo, canRedo: props.canRedo,
    onView: chrome.changeWorkspaceView, onUndo: props.onUndo, onRedo: props.onRedo,
    onDuplicate: props.onDuplicate, onDelete: props.onDelete,
    onRotateSelection: props.onRotateSelection, onNudge: props.onNudge,
    onClearSelection: () => { setActiveWallId(null); setActiveOpeningId(null); setActiveSurfaceId(null); setInspectRoom(false); props.onSelect(null); },
    onCancelTool: () => build.selectBuildTool("select"),
    onMeasureTool: () => build.selectBuildTool("measure"),
    onOpenMaterial: () => chrome.applyChromeTool("material"),
    onFitPlan: () => viewControlsRef.current?.fitPlan(),
    onFitSelection: () => viewControlsRef.current?.fitSelection(),
    onCycleSelection: (delta) => {
      if (!props.project) return;
      const next = nextSelectableObjectId(props.project.objects, props.selectedIds[0] ?? null, delta, props.project.activeRoomId);
      if (next) { setActiveOpeningId(null); setActiveSurfaceId(null); props.onSelect(next); }
    },
  });
  useEffect(() => { setRenderResults({ latest: null, previous: null }); }, [props.project?.id]);
  useEffect(() => { setAcceptedStillAssets([]); }, [props.project?.id]);

  const header = (
    <InteriorsWorkspaceHeader
      projectName={props.project?.name ?? null} roomName={room?.name ?? "Room"}
      revision={job?.revision ?? "A"}
      statusLabel={interiorsJobStatusLabel(job?.status ?? "draft", Boolean(props.project?.objects.some((item) => item.kind === "cabinet")))}
      workspaceView={chrome.workspaceView} isDirty={props.isDirty} autosaveState={props.autosaveState}
      canUndo={props.canUndo} canRedo={props.canRedo} presenting={chrome.plannerMode === "render"}
      chromeLocked={false}
      projectHome={props.projectHomeOpen || !props.project}
      uiMode={ui.mode} onUiMode={ui.setMode}
      onProject={() => chrome.changePlannerMode("project")} onView={chrome.changeWorkspaceView}
      onSave={props.onSaveProject} onUndo={props.onUndo} onRedo={props.onRedo} onPresent={chrome.present}
    />
  );

  if (!props.project || props.projectHomeOpen) {
    return (
      <section className={`lr-plan-shell lr-product-shell lr-product-shell-v2 is-project-home is-ui-${ui.mode}`} data-ui-mode={ui.mode}>
        {header}
        <div className="lr-empty-workspace">
          <LivingRoomHomeFromWorkspace
            workspace={props} open hasCurrentProject={Boolean(props.project)}
            uiMode={ui.mode}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={`lr-plan-shell lr-product-shell lr-product-shell-v2 is-ui-${ui.mode}`} data-ui-mode={ui.mode}>
      {header}
      <LivingRoomPlanWorkspaceBody
        workspace={props} project={props.project} room={room ?? null} underlay={underlay}
        workspaceView={chrome.workspaceView} plannerMode={chrome.plannerMode} studioPanel={chrome.studioPanel}
        onStudioPanel={chrome.setStudioPanel} chromeTool={chrome.chromeTool} onChromeTool={chrome.applyChromeTool}
        assetQuery={assetQuery} assetCategory={assetCategory} assetCategories={assetCategories}
        importError={importError} onAssetQuery={setAssetQuery} onAssetCategory={setAssetCategory}
        onImportError={setImportError} snapSizeMm={snapSizeMm} showGrid={showGrid}
        onShowGrid={setShowGrid} onSnapSize={setSnapSizeMm}
        activeWallId={activeWallId} activeOpeningId={activeOpeningId} activeOpening={activeOpening}
        activeSurfaceId={activeSurfaceId} setActiveSurfaceId={setActiveSurfaceId}
        setActiveWallId={setActiveWallId} setActiveOpeningId={setActiveOpeningId}
        roomPolygonPointCount={roomPolygonPointCount} roomPolygonCloseRequest={roomPolygonCloseRequest}
        onRoomPolygonPointCount={setRoomPolygonPointCount}
        onRoomPolygonCloseRequest={() => setRoomPolygonCloseRequest((count) => count + 1)}
        renderResults={renderResults}
        onRenderResults={(result) => setRenderResults((current) => ({ latest: result, previous: current.latest }))}
        build={build} activeBuildTool={build.buildCommandState.activeTool} onBuildTool={build.selectBuildTool}
        underlayPickerRef={underlayPickerRef} millwork={millwork} clientExport={clientExport}
        proposal={proposal} handoff={handoff}
        acceptedStillAssets={acceptedStillAssets} onAcceptedStillAssetsChange={setAcceptedStillAssets}
        issues={props.issues} readability={readability.settings} onReadability={readability.update}
        inspectRoom={inspectRoom} setInspectRoom={setInspectRoom}
        onWorkspaceView={chrome.changeWorkspaceView}
        onRegisterViewControls={registerViewControls}
        onFitPlan={() => viewControlsRef.current?.fitPlan()}
        onFitSelection={() => viewControlsRef.current?.fitSelection()}
      />
    </section>
  );
}
