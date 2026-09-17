import { useCallback, useEffect, useMemo, useState } from "react";
import type { Point3Mm, RenderQuality } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  getActiveLivingRoomStyleId,
  getCabinetMechanismState,
  LIVING_ROOM_STYLE_PRESETS,
  mechanismFrontIndex,
  mechanismPanelPatch,
  modelViewProjectLightScale,
  modelViewWindowKeyScale,
  preferModelViewCameraId,
  resolveModelViewCameraOverrides,
  resolveModelViewDefaultQuality,
  resolveModelViewLightingQuality,
  resolveModelViewRenderMode,
} from "../domain/livingRoom";
import { isWallRaised } from "../domain/interiorProject";
import {
  persistModelGuideDismissal,
  shouldShowModelGuide,
} from "../domain/livingRoom/modelViewGuidePreference";
import { useModelViewCameraSession } from "../hooks/useModelViewCameraSession";
import { useRenderDiagnostics } from "../hooks/useRenderDiagnostics";
import { CabinetSceneSemantics } from "./livingRoomScene/CabinetSceneSemantics";
import { LivingRoomModelChrome } from "./livingRoomScene/LivingRoomModelChrome";
import { type WallContextMenuState } from "./livingRoomScene/ModelWallVisibilityHost";
import { ModelViewAuthoringOverlays } from "./livingRoomScene/ModelViewAuthoringOverlays";
import { ModelViewScene } from "./livingRoomScene/ModelViewScene";
import { ModelViewFeedbackBanners } from "./livingRoomScene/ModelViewFeedbackBanners";
import { modelViewClientPresentationProps } from "../domain/livingRoom/modelViewClientPresentation";
import type { ModelTransformTarget } from "./livingRoomScene/ModelMoveGizmo";
import type { LivingRoomModelViewProps } from "./livingRoomModelViewProps";
import { resolveActiveModelSelection } from "./livingRoomScene/livingRoomModelViewSelection";
import {
  openingPatchFromTransform,
  resolveModelTransformPosition,
} from "./livingRoomScene/livingRoomModelViewTransform";

export type { LivingRoomModelViewProps } from "./livingRoomModelViewProps";

export function LivingRoomModelView({
  project, selectedIds, activeOpeningId, activeWallId, snapSizeMm, showGrid,
  onSelect, onSelectOpening, onSelectWall, onClearSelection, onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange, onSetRotation,
  onApplyStyle, onSetParameters, onPatchDocument, presentation = false,
  floorplanPreviewUrl = null,
  floorplanPreviewMode = "editable",
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(
    () => preferModelViewCameraId(scene.cameras),
  );
  const hasSelection = selectedIds.length > 0 || Boolean(activeOpeningId) || Boolean(activeWallId);
  const camera = useModelViewCameraSession(!presentation, hasSelection);
  const [showGuide, setShowGuide] = useState(shouldShowModelGuide);
  const [cameraHeightMm, setCameraHeightMm] = useState(3300);
  const [fieldOfViewDegrees, setFieldOfViewDegrees] = useState(42);
  const [cutawayWalls, setCutawayWalls] = useState(false);
  const [wallMenu, setWallMenu] = useState<WallContextMenuState | null>(null);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(resolveModelViewDefaultQuality);
  const honesty = describeModelViewHonesty(viewportQuality);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const { activeObject, activeOpening, transformTarget } = resolveActiveModelSelection({
    project, scene, selectedIds, activeOpeningId,
  });

  useEffect(() => {
    onTransformPreviewChange?.(null);
  }, [activeObject?.id, activeOpening?.id, onTransformPreviewChange]);

  const resolveTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    const resolved = resolveModelTransformPosition({
      target, proposed, project, snapSizeMm, onMovePreview,
    });
    onTransformPreviewChange?.({ ...target, positionMm: resolved });
    return resolved;
  }, [onMovePreview, onTransformPreviewChange, project, snapSizeMm]);

  const commitTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    const resolved = resolveTransformPosition(target, proposed);
    if (target.kind === "object") {
      onMove(target.id, resolved);
      onTransformPreviewChange?.(null);
      return;
    }
    const patch = openingPatchFromTransform(project, target, resolved, snapSizeMm);
    if (patch) onUpdateOpening?.(target.id, patch);
    onTransformPreviewChange?.(null);
  }, [onMove, onTransformPreviewChange, onUpdateOpening, project, resolveTransformPosition, snapSizeMm]);

  const activeCamera = scene.cameras.find((item) => item.id === activeCameraId) ?? scene.cameras[0] ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(camera.viewPreset, cameraHeightMm, fieldOfViewDegrees);
  const exitWalkthrough = useCallback(() => camera.setViewPreset("dollhouse"), [camera.setViewPreset]);
  const fitSelection = { objectIds: selectedIds, wallId: activeWallId, openingId: activeOpeningId };
  const clientView = modelViewClientPresentationProps({
    presentation, selectedIds, activeOpeningId, activeWallId, showGrid,
  });
  const noopSelect = () => {};

  return (
    <div
      className={`lr-model-viewport is-presence has-3d-onboarding${presentation ? " is-client-presentation" : ""}`}
      data-testid="lr-model-viewport"
      data-model-view-profile={JSON.stringify(describeModelViewRuntimeProfile(viewportQuality))}
      data-view-preset={camera.viewPreset}
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
          onSelectWall={onSelectWall} onPatchDocument={onPatchDocument}
        />
      ) : null}
      {!presentation ? <ModelViewFeedbackBanners /> : null}
      <div
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
          selectedIds={clientView.selectedIds}
          activeOpeningId={clientView.activeOpeningId}
          activeWallId={clientView.activeWallId}
          activeCameraId={activeCameraId} viewPreset={camera.viewPreset}
          cameraHeightMm={cameraOverrides.cameraHeightMm}
          fieldOfViewDegrees={cameraOverrides.fieldOfViewDegrees}
          snapSizeMm={snapSizeMm} showGrid={clientView.showGrid} cutawayWalls={cutawayWalls}
          interactive={clientView.interactive}
          fitVersion={camera.fitVersion} fitMode={camera.fitMode} fitSelection={fitSelection}
          onClearSelection={presentation ? noopSelect : onClearSelection}
          onSelect={presentation ? noopSelect : onSelect}
          onSelectOpening={presentation ? noopSelect : onSelectOpening}
          onSelectWall={presentation ? noopSelect : onSelectWall}
          onMove={onMove}
          transformTarget={presentation ? null : transformTarget}
          onTransformPreview={resolveTransformPosition}
          onTransformCommit={commitTransformPosition}
          onExitWalkthrough={exitWalkthrough}
          onWallContextMenu={presentation ? undefined : (wallId, point) => setWallMenu({ wallId, ...point })}
          floorplanPreviewUrl={floorplanPreviewUrl}
          floorplanPreviewMode={floorplanPreviewMode}
          onMechanismClick={(objectId, primitiveId) => {
            if (presentation) return;
            const object = project.objects.find((item) => item.id === objectId);
            const state = object ? getCabinetMechanismState(object) : null;
            const index = mechanismFrontIndex(primitiveId);
            if (state && index !== null && index < state.count) {
              onSetParameters(objectId, mechanismPanelPatch(index, !state.open[index]));
            }
          }}
        />
      </div>
      {!presentation ? (
        <LivingRoomModelChrome
          showGuide={showGuide} viewPreset={camera.viewPreset}
          onChoosePreset={camera.setViewPreset}
          onDismissGuide={() => { setShowGuide(false); persistModelGuideDismissal(); }}
          diagnostics={diagnostics} activeObject={activeObject} onSetParameters={onSetParameters}
          activeStyleId={activeStyleId} activeStyleName={activeStyle.name}
          onApplyStyle={onApplyStyle} honestyBadge={honesty.shortBadge}
          exposure={scene.style.colorManagement.exposure}
          planTraceHint={project.walls.some((wall) => wall.visible && !isWallRaised(wall))}
        />
      ) : null}
      <CabinetSceneSemantics project={project} />
    </div>
  );
}
