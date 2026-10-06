import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RenderQuality } from "../domain/interiorProject";
import { isWallRaised, setActiveInteriorRoom } from "../domain/interiorProject";
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
import { mechanismTogglePatch } from "../domain/livingRoom/mechanismToggle";
import { roomLightScaleForMood } from "../domain/livingRoom/lightingMood";
import { createRoomSceneCache } from "../domain/livingRoom/roomSceneCache";
import { modelViewCutsNearWall, modelViewHidesCeiling } from "../domain/livingRoom/modelReviewNodes";
import { persistModelGuideDismissal, shouldShowModelGuide } from "../domain/livingRoom/modelViewGuidePreference";
import { compileApartmentScene } from "../domain/livingRoom/apartmentScene";
import { apartmentOverviewAvailable, sceneWithOverviewCameras } from "../domain/livingRoom/overviewCameras";
import { overviewQualityStep } from "../domain/livingRoom/overviewQuality";
import { useDocumentCameraFollow } from "../hooks/useDocumentCameraFollow";
import { useModelViewCameraSession } from "../hooks/useModelViewCameraSession";
import { useModelViewTransform } from "../hooks/useModelViewTransform";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { useShowcaseTour } from "../hooks/useShowcaseTour";
import { useApartmentOverview } from "../hooks/useApartmentOverview";
import { modelViewClientPresentationProps } from "../domain/livingRoom/modelViewClientPresentation";
import type { LivingRoomModelViewProps } from "./livingRoomModelViewProps";
import { isCardCaptureSession } from "../domain/templateCardsCapture/captureMode";
import { LivingRoomModelViewport } from "./livingRoomScene/LivingRoomModelViewport";

/** Dev-only: production builds drop the capture bridge and its camera-path code. */
const CardCaptureDevBridge = import.meta.env.DEV
  ? lazy(() => import("./livingRoomScene/CardCaptureDevBridge").then((m) => ({ default: m.CardCaptureDevBridge })))
  : null;

export function LivingRoomModelView(props: LivingRoomModelViewProps) {
  const {
    project, selectedIds, activeOpeningId, activeWallId, activeLightId = null, snapSizeMm, showGrid,
    onSelect, onClearSelection, onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange, onSetRotation,
    onApplyStyle, onSetParameters, onPatchDocument, presentation = false, showStylePalette = false,
  } = props;
  const hasSelection = selectedIds.length > 0 || Boolean(activeOpeningId) || Boolean(activeWallId) || Boolean(activeLightId);
  const cardCapture = import.meta.env.DEV && isCardCaptureSession();
  const [captureOverview, setCaptureOverview] = useState(false);
  const stopTourRef = useRef<() => void>(() => undefined);
  const camera = useModelViewCameraSession(!presentation, hasSelection, () => stopTourRef.current());
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneFor = useMemo(() => createRoomSceneCache(project), [project]);
  const projectCameraId = project.renderSettings.activeCameraId ?? null;
  const [activeCameraId, setActiveCameraId] = useState(() => pickModelViewCameraId(sceneFor(null).cameras, [projectCameraId]));
  const tour = useShowcaseTour({
    project, sceneFor, presentation, viewPreset: camera.viewPreset, setViewPreset: camera.setViewPreset,
    activeCameraId, setActiveCameraId, canvasHostRef,
  });
  stopTourRef.current = tour.stop;
  const overview = useApartmentOverview({
    enabled: !presentation && apartmentOverviewAvailable(project.rooms.length),
    viewPreset: camera.viewPreset, setViewPreset: camera.setViewPreset,
    activeCameraId, setActiveCameraId, stopTour: tour.stop, onFrameRoom: camera.fitRoom,
  });
  const showApartment = (cardCapture && captureOverview) || overview.showApartment || tour.touringOverview;
  const apartmentScene = useMemo(() => (
    showApartment ? sceneWithOverviewCameras(compileApartmentScene(project, sceneFor)) : null
  ), [showApartment, project, sceneFor]);
  const scene = apartmentScene ?? tour.scene;
  useDocumentCameraFollow({
    projectCameraId, knownCameraIds: scene.cameras.map((item) => item.id),
    setActiveCameraId, setViewPreset: camera.setViewPreset,
  });
  const [showGuide, setShowGuide] = useState(() => !presentation && shouldShowModelGuide());
  useEffect(() => {
    if (showGuide) persistModelGuideDismissal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark the guide seen the first time it shows
  }, []);
  const [cameraHeightMm, setCameraHeightMm] = useState(3300);
  const [fieldOfViewDegrees, setFieldOfViewDegrees] = useState(42);
  const [cutawayWalls, setCutawayWalls] = useState(true);
  const [wallMenu, setWallMenu] = useState<{ wallId: string; x: number; y: number } | null>(null);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(resolveModelViewDefaultQuality);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const honesty = describeModelViewHonesty(viewportQuality);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const transform = useModelViewTransform({
    project, scene, selectedIds, activeOpeningId, snapSizeMm,
    onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange,
  });
  const activeCamera = scene.cameras.find((item) => item.id === activeCameraId) ?? scene.cameras[0] ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(camera.viewPreset, cameraHeightMm, fieldOfViewDegrees);
  const viewOnly = presentation || tour.tour.active || overview.phase !== "idle";
  const clientView = modelViewClientPresentationProps(viewOnly
    ? { presentation, showGrid, selectedIds: [], activeOpeningId: null, activeWallId: null }
    : { presentation, showGrid, selectedIds, activeOpeningId, activeWallId });
  const activateRoom = useCallback((roomId: string) => {
    if (roomId !== project.activeRoomId) {
      onPatchDocument?.((current) => setActiveInteriorRoom(current, roomId), "Switched active room.");
    }
    overview.leave(true);
  }, [onPatchDocument, overview.leave, project.activeRoomId]);
  useEffect(() => {
    if (overview.showApartment && camera.viewPreset !== "perspective") camera.setViewPreset("perspective");
  }, [overview.showApartment, camera.viewPreset, camera.setViewPreset]);
  useEffect(() => { if (!overview.showApartment) setHoveredRoomId(null); }, [overview.showApartment]);
  // The overview opens in Draft; leaving restores the room view's quality (view state only).
  // Still capture (?capture=1) sets client-preview itself; this step would wipe that preset.
  const qualityBeforeOverview = useRef<RenderQuality | null>(null);
  useEffect(() => {
    if (cardCapture) return;
    const step = overviewQualityStep(showApartment, viewportQuality, qualityBeforeOverview.current);
    qualityBeforeOverview.current = step.saved;
    if (step.set) setViewportQuality(step.set);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on entering or leaving the overview
  }, [showApartment, cardCapture]);

  return (
    <>
      {CardCaptureDevBridge && cardCapture ? (
        <Suspense fallback={null}>
          <CardCaptureDevBridge
            project={project}
            sceneFor={sceneFor}
            canvasHostRef={canvasHostRef}
            onPatchDocument={onPatchDocument}
            setViewportQuality={setViewportQuality}
            setMoodOverride={tour.setMood}
            setCaptureOverview={setCaptureOverview}
            setActiveCameraId={setActiveCameraId}
          />
        </Suspense>
      ) : null}
    <LivingRoomModelViewport
      handlers={props} camera={camera} tour={tour} scene={scene} overview={overview}
      canvasHostRef={canvasHostRef} showGuide={showGuide} onShowGuide={setShowGuide}
      cameraHeightMm={cameraHeightMm} onCameraHeightMm={setCameraHeightMm}
      fieldOfViewDegrees={fieldOfViewDegrees} onFieldOfViewDegrees={setFieldOfViewDegrees}
      cutawayWalls={cutawayWalls} onCutawayWalls={setCutawayWalls}
      wallMenu={wallMenu} onWallMenu={setWallMenu}
      viewportQuality={viewportQuality} onViewportQuality={setViewportQuality}
      honesty={honesty} activeStyleId={activeStyleId} activeStyleName={activeStyle.name}
      transform={transform} activeCameraId={activeCameraId} onActiveCameraId={setActiveCameraId}
      diagnostics={diagnostics} cameraOverrides={cameraOverrides}
      viewOnly={viewOnly} clientView={clientView} hoveredRoomId={hoveredRoomId}
      onHoverRoom={setHoveredRoomId} onActivateRoom={activateRoom}
      showStylePalette={showStylePalette} presentation={presentation}
      captureFixedDpr={cardCapture ? 2 : undefined}
      profile={describeModelViewRuntimeProfile(viewportQuality)}
      ceilingHidden={modelViewHidesCeiling(camera.viewPreset)}
      nearWallCut={modelViewCutsNearWall(camera.viewPreset)}
      lightScale={modelViewProjectLightScale(viewportQuality)}
      windowScale={modelViewWindowKeyScale(viewportQuality)}
      roomLightScale={roomLightScaleForMood(tour.mood)}
      renderMode={resolveModelViewRenderMode()}
      lightingQuality={resolveModelViewLightingQuality(viewportQuality)}
      planTrace={project.walls.some((wall) => wall.visible && !isWallRaised(wall))}
      onRotate={(rotationY) => { if (transform.activeObject) onSetRotation(transform.activeObject.id, rotationY); }}
      onMechanism={(objectId, primitiveId) => {
        const patch = viewOnly ? null : mechanismTogglePatch(project, objectId, primitiveId);
        if (patch) onSetParameters(objectId, patch);
      }}
      onApplyStyle={onApplyStyle} onSetParameters={onSetParameters} onPatchDocument={onPatchDocument}
      onSelect={onSelect} onClearSelection={onClearSelection} snapSizeMm={snapSizeMm}
      activeLightId={activeLightId}
    />
    </>
  );
}
