import { noteProjectSnapshot } from "../domain/projectSnapshots/capture";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIVING_ROOM_CATALOG, getLivingRoomPlanUnderlay, type LivingRoomRenderResult } from "../domain/livingRoom";
import { millworkAssetCategories } from "../domain/livingRoom/millworkShortcuts";
import { designUxShellClassNames } from "../domain/desktopUx";
import { useClientPresentationExport } from "../hooks/useClientPresentationExport";
import { useLivingRoomPlanWorkspaceHotkeys } from "../hooks/useLivingRoomPlanWorkspaceHotkeys";
import { useLivingRoomBuildCommands } from "../hooks/useLivingRoomBuildCommands";
import { useMillworkSchedule } from "../hooks/useMillworkSchedule";
import { useProposalWorkflow } from "../hooks/useProposalWorkflow";
import { useEngineeringHandoff } from "../hooks/useEngineeringHandoff";
import { useInteriorsWorkspaceChrome } from "../hooks/useInteriorsWorkspaceChrome";
import { useDraftingAppearance } from "../hooks/useDraftingAppearance";
import type { AcceptedStillAsset } from "../hooks/selectPackageAcceptedStillAssets";
import { usePlanReadabilitySettings } from "./livingRoomPlan/usePlanReadabilitySettings";
import { LivingRoomWorkspaceTopBar } from "./livingRoomPlan/LivingRoomWorkspaceTopBar";
import { LivingRoomHomeFromWorkspace } from "./livingRoomPlan/LivingRoomHomeFromWorkspace";
import { LivingRoomPlanWorkspaceBody } from "./livingRoomPlan/LivingRoomPlanWorkspaceBody";
import { useInteriorsProjectsFixtures } from "./livingRoomPlan/InteriorsProjectsFixtures";
import type { LivingRoomPlanWorkspaceProps } from "./livingRoomPlan/workspaceProps";
import { deleteLightOrObject, duplicateLightOrObject } from "./livingRoomPlan/lightOnlySelectionEdit";
import type { PlanViewControls } from "./livingRoomPlan/planViewControls";
import { LivingRoomPlanHomeShell } from "./livingRoomPlan/LivingRoomPlanHomeShell";
import { useSelectionFrameRequest } from "../hooks/useSelectionFrameRequest";
import { ProjectTabLockNotice } from "./ProjectTabLockNotice";

export function LivingRoomPlanWorkspace(props: LivingRoomPlanWorkspaceProps) {
  const draftingAppearance = useDraftingAppearance();
  const [snapSizeMm, setSnapSizeMm] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [importError, setImportError] = useState("");
  const [activeWallId, setActiveWallId] = useState<string | null>(null);
  const [activeOpeningId, setActiveOpeningId] = useState<string | null>(null);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(null);
  const [activeLightId, setActiveLightId] = useState<string | null>(null);
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
    selectBuildTool: build.selectBuildTool, onRaiseWalls: props.onRaiseWalls,
  });
  useInteriorsProjectsFixtures({
    enabled: true,
    onOpenDemo: () => { props.onDiscardRecovery(); props.onOpenDemo(); },
    onOpenGoldenRun: () => { props.onDiscardRecovery(); props.onOpenGoldenRun(); },
    onOpenRenderStudio: chrome.showRenderStudio,
  });
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
    setActiveLightId((c) => {
      const light = p.lights.find((item) => item.id === c);
      return light && light.roomId === p.activeRoomId ? c : null;
    });
  }, [props.project]);
  useEffect(() => {
    if (activeWallId || activeOpeningId || activeSurfaceId) {
      setInspectRoom(false);
      setActiveLightId(null);
    }
  }, [activeWallId, activeOpeningId, activeSurfaceId]);

  useSelectionFrameRequest(() => viewControlsRef.current?.fitSelection());
  const clearArchitecture = () => {
    setActiveWallId(null); setActiveOpeningId(null); setActiveSurfaceId(null); setActiveLightId(null); setInspectRoom(false); props.onSelect(null);
  };
  const lightEdit = {
    activeLightId, selectedIds: props.selectedIds, lightActions: props.lightActions,
    onDuplicate: props.onDuplicate, onDelete: props.onDelete, onClearSelection: clearArchitecture,
  };
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
    onDuplicate: () => duplicateLightOrObject(lightEdit),
    onDelete: () => deleteLightOrObject(lightEdit),
    onRotateSelection: props.onRotateSelection,
    onNudge: props.onNudge,
    onSelect: (id) => { setActiveOpeningId(null); setActiveSurfaceId(null); setActiveLightId(null); props.onSelect(id); },
    onClearArchitecture: clearArchitecture,
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
  const header = <LivingRoomWorkspaceTopBar workspace={props} chrome={chrome} roomName={room?.name ?? "Room"} />;
  if (!props.project || props.projectHomeOpen) {
    return (
      <LivingRoomPlanHomeShell header={header}>
        <LivingRoomHomeFromWorkspace
          workspace={props} open hasCurrentProject={Boolean(props.project)}
        />
      </LivingRoomPlanHomeShell>
    );
  }
  return (
    <section className={designUxShellClassNames({
      appearance: draftingAppearance.appearance,
      presenting: chrome.plannerMode === "render",
    }).join(" ")} data-drafting-appearance={draftingAppearance.appearance}>
      {header}
      <ProjectTabLockNotice projectId={props.project?.id ?? null} />
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
        activeSurfaceId={activeSurfaceId} activeLightId={activeLightId} setActiveSurfaceId={setActiveSurfaceId}
        setActiveWallId={setActiveWallId} setActiveOpeningId={setActiveOpeningId} setActiveLightId={setActiveLightId}
        roomPolygonPointCount={roomPolygonPointCount} roomPolygonCloseRequest={roomPolygonCloseRequest}
        onRoomPolygonPointCount={setRoomPolygonPointCount}
        onRoomPolygonCloseRequest={() => { setRoomPolygonCloseRequest((count) => count + 1); }}
        renderResults={renderResults}
        onRenderResults={(result) => { setRenderResults((current) => ({ latest: result, previous: current.latest })); noteProjectSnapshot("render"); }}
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
  );
}
