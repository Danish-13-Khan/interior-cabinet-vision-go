import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIVING_ROOM_CATALOG, getLivingRoomPlanUnderlay, readProposalCommercial, type LivingRoomRenderResult } from "../domain/livingRoom";
import { millworkAssetCategories } from "../domain/livingRoom/millworkShortcuts";
import { designUxShellClassNames, interiorsJobStatusLabel } from "../domain/desktopUx";
import { useClientPresentationExport } from "../hooks/useClientPresentationExport";
import { useLivingRoomPlanWorkspaceHotkeys } from "../hooks/useLivingRoomPlanWorkspaceHotkeys";
import { useLivingRoomBuildCommands } from "../hooks/useLivingRoomBuildCommands";
import { useMillworkSchedule } from "../hooks/useMillworkSchedule";
import { useProposalWorkflow } from "../hooks/useProposalWorkflow";
import { useEngineeringHandoff } from "../hooks/useEngineeringHandoff";
import { useInteriorsWorkspaceChrome } from "../hooks/useInteriorsWorkspaceChrome";
import { useInteriorsUiMode } from "../hooks/useInteriorsUiMode";
import { useDraftingAppearance } from "../hooks/useDraftingAppearance";
import type { AcceptedStillAsset } from "../hooks/selectPackageAcceptedStillAssets";
import { usePlanReadabilitySettings } from "./livingRoomPlan/usePlanReadabilitySettings";
import { InteriorsWorkspaceHeader } from "./livingRoomPlan/InteriorsWorkspaceHeader";
import { InteriorsWorkflowNav } from "./livingRoomPlan/InteriorsWorkflowNav";
import { LivingRoomHomeFromWorkspace } from "./livingRoomPlan/LivingRoomHomeFromWorkspace";
import { LivingRoomPlanWorkspaceBody } from "./livingRoomPlan/LivingRoomPlanWorkspaceBody";
import { useInteriorsProjectsFixtures } from "./livingRoomPlan/InteriorsProjectsFixtures";
import type { LivingRoomPlanWorkspaceProps } from "./livingRoomPlan/workspaceProps";
import type { PlanViewControls } from "./livingRoomPlan/planViewControls";
import { LivingRoomPlanHomeShell } from "./livingRoomPlan/LivingRoomPlanHomeShell";
import { StudioChrome } from "./studio/StudioChrome";
import { StudioMain } from "./studio/StudioMain";
import { useStudioNav } from "../hooks/useStudioNav";

export function LivingRoomPlanWorkspace(props: LivingRoomPlanWorkspaceProps) {
  const ui = useInteriorsUiMode();
  const draftingAppearance = useDraftingAppearance();
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
  const viewControlsRef = useRef<PlanViewControls | null>(null);
  const registerViewControls = useCallback((controls: PlanViewControls | null) => { viewControlsRef.current = controls; }, []);
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
  const assetCategories = useMemo(() => millworkAssetCategories(LIVING_ROOM_CATALOG.map((item) => item.category)), []);

  useEffect(() => {
    props.onClearPreDropReason?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional on tool identity only
  }, [build.buildCommandState.activeTool, chrome.chromeTool, chrome.plannerMode]);
  useEffect(() => {
    if (!props.project) return;
    const p = props.project;
    setActiveWallId((c) => (p.walls.some((w) => w.id === c) ? c : null));
    setActiveOpeningId((c) => (p.openings.some((o) => o.id === c) ? c : null));
    setActiveSurfaceId((c) => (p.surfaces.some((s) => s.id === c) ? c : null));
  }, [props.project]);
  useEffect(() => {
    if (activeWallId || activeOpeningId || activeSurfaceId) setInspectRoom(false);
  }, [activeWallId, activeOpeningId, activeSurfaceId]);

  useLivingRoomPlanWorkspaceHotkeys({
    project: props.project,
    projectHomeOpen: props.projectHomeOpen,
    snapSizeMm,
    workspaceView: chrome.workspaceView,
    canUndo: props.canUndo,
    canRedo: props.canRedo,
    selectedIds: props.selectedIds,
    activeWallId,
    onView: chrome.changeWorkspaceView,
    onUndo: props.onUndo,
    onRedo: props.onRedo,
    onDuplicate: props.onDuplicate,
    onDelete: props.onDelete,
    onRotateSelection: props.onRotateSelection,
    onNudge: props.onNudge,
    onSelect: (id) => { setActiveOpeningId(null); setActiveSurfaceId(null); props.onSelect(id); },
    onClearArchitecture: () => {
      setActiveWallId(null); setActiveOpeningId(null); setActiveSurfaceId(null); setInspectRoom(false); props.onSelect(null);
    },
    onCancelTool: () => build.selectBuildTool("select"),
    onMeasureTool: () => build.selectBuildTool("measure"),
    onOpenMaterial: () => chrome.applyChromeTool("material"),
    onFitPlan: () => viewControlsRef.current?.fitPlan(),
    onFitSelection: () => viewControlsRef.current?.fitSelection(),
    onPatchDocument: props.onPatchDocument,
  });
  useEffect(() => {
    setRenderResults({ latest: null, previous: null });
    setAcceptedStillAssets([]);
  }, [props.project?.id]);
  const nav = useStudioNav(Boolean(props.project) && !props.projectHomeOpen);
  const saveTone = props.autosaveState === "error" ? "error" : props.autosaveState === "saved" && !props.isDirty ? "saved" : "idle";
  const saveLabel = props.autosaveState === "saving" ? "Saving" : props.isDirty ? "Unsaved" : props.autosaveState === "error" ? "Save failed" : "Saved";
  const home = (
    <LivingRoomPlanHomeShell uiMode={ui.mode} header={null}>
      <LivingRoomHomeFromWorkspace workspace={props} open hasCurrentProject={Boolean(props.project)} uiMode={ui.mode} />
    </LivingRoomPlanHomeShell>
  );
  const design = props.project && !props.projectHomeOpen ? (
    <section className={designUxShellClassNames({
      uiMode: ui.mode,
      appearance: draftingAppearance.appearance,
      presenting: chrome.plannerMode === "render",
    }).join(" ")} data-ui-mode={ui.mode} data-drafting-appearance={draftingAppearance.appearance}>
      <InteriorsWorkspaceHeader
        projectName={props.project.name} roomName={room?.name ?? "Room"}
        revision={job?.revision ?? "A"}
        statusLabel={interiorsJobStatusLabel(job?.status ?? "draft", props.project.objects.some((item) => item.kind === "cabinet"))}
        workspaceView={chrome.workspaceView} isDirty={props.isDirty} autosaveState={props.autosaveState}
        canUndo={props.canUndo} canRedo={props.canRedo} presenting={chrome.plannerMode === "render"} chromeLocked={false}
        uiMode={ui.mode} onUiMode={ui.setMode}
        onProject={() => chrome.changePlannerMode("project")}
        onOpen={props.onOpenProject} onExport={props.onExportProject}
        onView={chrome.changeWorkspaceView}
        onSave={props.onSaveProject} onUndo={props.onUndo} onRedo={props.onRedo} onPresent={chrome.present}
        onOpenShortcuts={props.onOpenShortcuts}
        appearance={draftingAppearance.appearance}
        onAppearance={draftingAppearance.setAppearance}
      />
      <InteriorsWorkflowNav area={chrome.workflowArea} onArea={chrome.setWorkflowArea} />
      <LivingRoomPlanWorkspaceBody
        workspace={props} project={props.project} room={room ?? null} underlay={underlay}
        workspaceView={chrome.workspaceView} plannerMode={chrome.plannerMode}
        workflowArea={chrome.workflowArea} studioPanel={chrome.studioPanel}
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
        onPresent={chrome.present}
        onReturnToReview={chrome.returnToReview}
        onRegisterViewControls={registerViewControls}
        onFitPlan={() => viewControlsRef.current?.fitPlan()}
        onFitSelection={() => viewControlsRef.current?.fitSelection()}
        onZoomIn={() => viewControlsRef.current?.zoomIn()}
        onZoomOut={() => viewControlsRef.current?.zoomOut()}
      />
    </section>
  ) : null;
  return (
    <StudioChrome
      surface={props.project && !props.projectHomeOpen ? nav.surface : "studio"}
      section={nav.section}
      workflow={nav.workflow}
      collapsed={Boolean(props.project) && !props.projectHomeOpen && nav.collapsed}
      projectName={props.project?.name ?? null}
      roomName={room?.name ?? "Room"}
      revision={job?.revision ?? "A"}
      saveLabel={saveLabel}
      saveTone={saveTone}
      projectOpen={Boolean(props.project) && !props.projectHomeOpen}
      onSection={(section) => { nav.openSection(section); if (section === "projects") props.onOpenProjectHome(); }}
      onWorkflow={nav.openWorkflow}
      onToggleSidebar={nav.toggleSidebar}
      onSave={props.onSaveProject}
    >
      <StudioMain
        surface={props.project && !props.projectHomeOpen ? nav.surface : "studio"}
        section={props.projectHomeOpen || !props.project ? "projects" : nav.section}
        workflow={nav.workflow}
        project={props.project}
        onPatchDocument={(update) => props.onPatchDocument(update, "Project details updated")}
        proposal={proposal}
        handoff={handoff}
        cutlistLines={millwork.productionReport?.productionCutlist ?? []}
        cutlistStatus={millwork.status}
        home={home}
        design={design}
      />
    </StudioChrome>
  );
}
