import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RenderQuality } from "../domain/interiorProject";
import {
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  getActiveLivingRoomStyleId,
  LIVING_ROOM_STYLE_PRESETS,
  modelViewProjectLightScale,
  modelViewWindowKeyScale,
  pickModelViewCameraId,
  resolveModelViewCameraOverrides,
  resolveModelViewDefaultQuality,
  resolveModelViewLightingQuality,
  resolveModelViewRenderMode,
} from "../domain/livingRoom";
import { isWallRaised } from "../domain/interiorProject";
import { mechanismTogglePatch } from "../domain/livingRoom/mechanismToggle";
import { roomLightScaleForMood } from "../domain/livingRoom/lightingMood";
import { createRoomSceneCache } from "../domain/livingRoom/roomSceneCache";
import { modelViewCutsNearWall, modelViewHidesCeiling } from "../domain/livingRoom/modelReviewNodes";
import {
  persistModelGuideDismissal,
  shouldShowModelGuide,
} from "../domain/livingRoom/modelViewGuidePreference";
import { useDocumentCameraFollow } from "../hooks/useDocumentCameraFollow";
import { useModelViewCameraSession } from "../hooks/useModelViewCameraSession";
import { useModelViewTransform } from "../hooks/useModelViewTransform";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { useShowcaseTour } from "../hooks/useShowcaseTour";
import { ShowcaseTourControls } from "./livingRoomScene/ShowcaseTourControls";
import { CabinetSceneSemantics } from "./livingRoomScene/CabinetSceneSemantics";
import { LivingRoomModelChrome } from "./livingRoomScene/LivingRoomModelChrome";
import { type WallContextMenuState } from "./livingRoomScene/ModelWallVisibilityHost";
import { ModelViewAuthoringOverlays } from "./livingRoomScene/ModelViewAuthoringOverlays";
import { ModelViewScene } from "./livingRoomScene/ModelViewScene";
import { ModelViewFeedbackBanners } from "./livingRoomScene/ModelViewFeedbackBanners";
import { PlanTraceRaisePrompt } from "./livingRoomScene/PlanTraceEmptyState";
import { modelViewClientPresentationProps } from "../domain/livingRoom/modelViewClientPresentation";
import type { LivingRoomModelViewProps } from "./livingRoomModelViewProps";

export function LivingRoomModelView({
  project, selectedIds, activeOpeningId, activeWallId, activeLightId = null, snapSizeMm, showGrid,
  onSelect, onSelectOpening, onSelectWall, onSelectLight, lightActions, onClearSelection, onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange, onSetRotation,
  onApplyStyle, onSetParameters, onPatchDocument, presentation = false, showStylePalette = false,
}: LivingRoomModelViewProps) {
  const hasSelection = selectedIds.length > 0 || Boolean(activeOpeningId) || Boolean(activeWallId) || Boolean(activeLightId);
  const camera = useModelViewCameraSession(!presentation, hasSelection);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneFor = useMemo(() => createRoomSceneCache(project), [project]);
  const projectCameraId = project.renderSettings.activeCameraId ?? null;
  const [activeCameraId, setActiveCameraId] = useState(() => pickModelViewCameraId(sceneFor(null).cameras, [projectCameraId]));
  const tour = useShowcaseTour({
    project, sceneFor, presentation, viewPreset: camera.viewPreset, setViewPreset: camera.setViewPreset,
    activeCameraId, setActiveCameraId, canvasHostRef,
  });
  const scene = tour.scene; // view-only: the toured room's scene, memoized per room
  const extrudedWalls = scene.nodes.filter((node) => node.metadata.role === "wall" && node.metadata.planTrace !== true).length;
  // Showcase / Render Studio drive the document camera; jump revives after orbit.
  useDocumentCameraFollow({
    projectCameraId,
    knownCameraIds: scene.cameras.map((item) => item.id),
    setActiveCameraId,
    setViewPreset: camera.setViewPreset,
  });
  const [showGuide, setShowGuide] = useState(() => !presentation && shouldShowModelGuide());
  useEffect(() => {
    if (showGuide) persistModelGuideDismissal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark the guide seen the first time it shows
  }, []);
  const [cameraHeightMm, setCameraHeightMm] = useState(3300);
  const [fieldOfViewDegrees, setFieldOfViewDegrees] = useState(42);
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const [wallMenu, setWallMenu] = useState<WallContextMenuState | null>(null);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(resolveModelViewDefaultQuality);
  const honesty = describeModelViewHonesty(viewportQuality);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const { activeObject, transformTarget, resolveTransformPosition, commitTransformPosition } = useModelViewTransform({
    project, scene, selectedIds, activeOpeningId, snapSizeMm,
    onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange,
  });
  const activeCamera = scene.cameras.find((item) => item.id === activeCameraId)
    ?? scene.cameras[0] ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(
    camera.viewPreset, cameraHeightMm, fieldOfViewDegrees,
  );
  const exitWalkthrough = useCallback(() => camera.setViewPreset("dollhouse"), [camera.setViewPreset]);
  const fitSelection = { objectIds: selectedIds, wallId: activeWallId, openingId: activeOpeningId };
  const viewOnly = presentation || tour.tour.active; // the tour shows no outline or gizmo from the room being edited
  const clientView = modelViewClientPresentationProps(viewOnly
    ? { presentation, showGrid, selectedIds: [], activeOpeningId: null, activeWallId: null }
    : { presentation, showGrid, selectedIds, activeOpeningId, activeWallId });
  const noopSelect = () => {};

  return (
    <div
      className={`lr-model-viewport is-presence has-3d-onboarding${presentation ? " is-client-presentation" : ""}`}
      data-testid="lr-model-viewport"
      data-model-view-profile={JSON.stringify(describeModelViewRuntimeProfile(viewportQuality))}
      data-view-preset={camera.viewPreset}
      data-scene-height-mm={Math.round(scene.bounds.size.heightMm)}
      data-extruded-walls={extrudedWalls}
      data-ceiling-hidden={modelViewHidesCeiling(camera.viewPreset) ? "1" : "0"}
      data-near-wall-cut={modelViewCutsNearWall(camera.viewPreset) ? "1" : "0"}
    >
      {!presentation ? (
        <ModelViewAuthoringOverlays
          project={project} activeWallId={activeWallId} wallMenu={wallMenu}
          viewPreset={camera.viewPreset} cameraHeightMm={cameraHeightMm}
          fieldOfViewDegrees={fieldOfViewDegrees} activeCameraId={activeCameraId}
          cameras={scene.cameras} cutawayWalls={cutawayWalls}
          activeRotation={activeObject ? Math.round(activeObject.rotation.y) : 0}
          hasActiveObject={Boolean(activeObject)} viewportQuality={viewportQuality}
          honesty={honesty} hasSelection={hasSelection}
          onViewPreset={camera.setViewPreset} onCameraHeightMm={setCameraHeightMm}
          onFieldOfViewDegrees={setFieldOfViewDegrees} onActiveCameraId={setActiveCameraId}
          onCutawayWalls={setCutawayWalls}
          onSetRotation={(rotationY) => { if (activeObject) onSetRotation(activeObject.id, rotationY); }}
          onViewportQuality={setViewportQuality} onOpenGuide={() => setShowGuide(true)}
          onClearSelection={onClearSelection} onFitRoom={camera.fitRoom}
          onFocusSelection={camera.focusSelection} onCloseWallMenu={() => setWallMenu(null)}
          onSelectWall={onSelectWall} onSelectLight={onSelectLight} lightActions={lightActions} onPatchDocument={onPatchDocument}
        />
      ) : null}
      {!presentation ? <ModelViewFeedbackBanners /> : null}
      <div
        ref={canvasHostRef}
        className="lr-model-canvas-host"
        data-testid="lr-model-canvas-host"
        tabIndex={presentation ? undefined : 0}
        onFocus={camera.onCanvasFocus}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          camera.onCanvasBlur();
        }}
        onPointerDown={(event) => { if (!presentation) event.currentTarget.focus(); }}
      >
        <ModelViewScene
          scene={scene} viewportQuality={viewportQuality}
          renderMode={resolveModelViewRenderMode()}
          lightingQuality={resolveModelViewLightingQuality(viewportQuality)}
          projectLightScale={modelViewProjectLightScale(viewportQuality)}
          windowKeyScale={modelViewWindowKeyScale(viewportQuality)}
          roomLightScale={roomLightScaleForMood(tour.mood)}
          selectedIds={clientView.selectedIds}
          activeOpeningId={clientView.activeOpeningId}
          activeWallId={clientView.activeWallId}
          selectedLightId={viewOnly ? null : activeLightId}
          onSelectLight={presentation ? noopSelect : onSelectLight}
          onMoveLight={presentation ? undefined : lightActions?.moveLight}
          activeCameraId={activeCameraId} viewPreset={camera.viewPreset}
          cameraHeightMm={cameraOverrides.cameraHeightMm}
          fieldOfViewDegrees={cameraOverrides.fieldOfViewDegrees}
          snapSizeMm={snapSizeMm} showGrid={clientView.showGrid} cutawayWalls={cutawayWalls}
          interactive={clientView.interactive}
          frameRun={tour.frameRun} renderComposition={tour.composition}
          fitVersion={camera.fitVersion} fitMode={camera.fitMode} fitSelection={fitSelection}
          onClearSelection={presentation ? noopSelect : onClearSelection}
          onSelect={presentation ? noopSelect : onSelect}
          onSelectOpening={presentation ? noopSelect : onSelectOpening}
          onSelectWall={presentation ? noopSelect : onSelectWall}
          onMove={onMove}
          transformTarget={viewOnly ? null : transformTarget}
          onTransformPreview={resolveTransformPosition}
          onTransformCommit={commitTransformPosition}
          onExitWalkthrough={exitWalkthrough}
          onWallContextMenu={presentation ? undefined : (wallId, point) => setWallMenu({ wallId, ...point })}
          onMechanismClick={(objectId, primitiveId) => {
            const patch = presentation ? null : mechanismTogglePatch(project, objectId, primitiveId);
            if (patch) onSetParameters(objectId, patch);
          }}
        />
        {!presentation ? <PlanTraceRaisePrompt project={project} onPatchDocument={onPatchDocument} /> : null}
      </div>
      <ShowcaseTourControls
        available={tour.available} stops={tour.stops} tour={tour.tour} mood={tour.mood}
        showMood={tour.showMood} onStart={tour.start} onStop={tour.stop} onMood={tour.setMood}
      />
      {!presentation ? (
        <LivingRoomModelChrome
          showGuide={showGuide} viewPreset={camera.viewPreset}
          onChoosePreset={camera.setViewPreset} onResetCamera={camera.resetView}
          onDismissGuide={() => { setShowGuide(false); persistModelGuideDismissal(); }}
          diagnostics={diagnostics} activeObject={activeObject} onSetParameters={onSetParameters}
          activeStyleId={activeStyleId} activeStyleName={activeStyle.name}
          onApplyStyle={onApplyStyle} honestyBadge={honesty.shortBadge}
          exposure={scene.style.colorManagement.exposure}
          planTraceHint={project.walls.some((wall) => wall.visible && !isWallRaised(wall))}
          showStylePalette={showStylePalette}
        />
      ) : null}
      <CabinetSceneSemantics project={project} />
    </div>
  );
}
