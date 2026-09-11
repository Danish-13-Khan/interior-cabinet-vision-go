import { useCallback, useEffect, useMemo, useState } from "react";
import type { InteriorProject, Point3Mm, RenderQuality } from "../domain/interiorProject";
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
  openingOffsetAtPoint,
  preferModelViewCameraId,
  resolveModelViewCameraOverrides,
  resolveModelViewDefaultQuality,
  resolveModelViewLightingQuality,
  resolveModelViewRenderMode,
  type LivingRoomStyleId,
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
import type { ModelTransformPreview, ModelTransformTarget } from "./livingRoomScene/ModelMoveGizmo";

type LivingRoomModelViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  activeOpeningId: string | null;
  activeWallId: string | null;
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMovePreview?: (objectId: string, position: Point3Mm) => { position: Point3Mm; rotationY: number } | null | void;
  onUpdateOpening?: (openingId: string, patch: { offsetMm?: number; sillHeightMm?: number }) => void;
  onTransformPreviewChange?: (preview: ModelTransformPreview | null) => void;
  onSetRotation: (objectId: string, rotationY: number) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onPatchDocument?: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
  presentation?: boolean;
};

export function LivingRoomModelView({
  project, selectedIds, activeOpeningId, activeWallId, snapSizeMm, showGrid,
  onSelect, onSelectOpening, onSelectWall, onClearSelection, onMove, onMovePreview, onUpdateOpening, onTransformPreviewChange, onSetRotation,
  onApplyStyle, onSetParameters, onPatchDocument, presentation = false,
}: LivingRoomModelViewProps) {
  const scene = useMemo(() => compileLivingRoomScene(project), [project]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(
    () => preferModelViewCameraId(scene.cameras),
  );
  const camera = useModelViewCameraSession(!presentation);
  const [showGuide, setShowGuide] = useState(shouldShowModelGuide);
  const [cameraHeightMm, setCameraHeightMm] = useState(3300);
  const [fieldOfViewDegrees, setFieldOfViewDegrees] = useState(42);
  const [cutawayWalls, setCutawayWalls] = useState(false);
  const [wallMenu, setWallMenu] = useState<WallContextMenuState | null>(null);
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(
    resolveModelViewDefaultQuality,
  );
  const honesty = describeModelViewHonesty(viewportQuality);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const activeObject = selectedIds.length === 1
    ? project.objects.find((object) => object.id === selectedIds[0]) ?? null
    : null;
  const activeObjectOrigin = activeObject
    ? scene.nodes.find((node) => node.sourceObjectId === activeObject.id)?.positionMm ?? activeObject.position
    : null;
  const activeOpening = activeOpeningId
    ? project.openings.find((opening) => opening.id === activeOpeningId) ?? null
    : null;
  const activeOpeningWall = activeOpening
    ? project.walls.find((wall) => wall.id === activeOpening.wallId) ?? null
    : null;
  const openingCenter = activeOpening && activeOpeningWall
    ? (() => {
        const dx = activeOpeningWall.end.x - activeOpeningWall.start.x;
        const dz = activeOpeningWall.end.z - activeOpeningWall.start.z;
        const length = Math.max(1, Math.hypot(dx, dz));
        const center = activeOpening.offsetMm + activeOpening.widthMm / 2;
        return {
          x: activeOpeningWall.start.x + dx / length * center,
          y: activeOpening.sillHeightMm,
          z: activeOpeningWall.start.z + dz / length * center,
        };
      })()
    : null;
  const transformTarget: ModelTransformTarget | null = activeObject
    ? { kind: "object", id: activeObject.id, positionMm: activeObjectOrigin ?? activeObject.position }
    : activeOpening && openingCenter
      ? { kind: "opening", id: activeOpening.id, positionMm: openingCenter }
      : null;

  useEffect(() => {
    onTransformPreviewChange?.(null);
  }, [activeObject?.id, activeOpening?.id, onTransformPreviewChange]);

  const resolveTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    let resolved: Point3Mm;
    if (target.kind === "object") {
      const preview = onMovePreview?.(target.id, proposed);
      resolved = preview && typeof preview === "object" ? preview.position : proposed;
      onTransformPreviewChange?.({ ...target, positionMm: resolved });
      return resolved;
    }
    const opening = project.openings.find((item) => item.id === target.id);
    const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
    if (!opening || !wall) return target.positionMm;
    const offsetMm = openingOffsetAtPoint(wall, proposed, opening.widthMm, snapSizeMm);
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.max(1, Math.hypot(dx, dz));
    const center = offsetMm + opening.widthMm / 2;
    resolved = {
      x: wall.start.x + dx / length * center,
      y: Math.min(Math.max(0, wall.heightMm - opening.heightMm), Math.max(0, proposed.y)),
      z: wall.start.z + dz / length * center,
    };
    onTransformPreviewChange?.({ ...target, positionMm: resolved });
    return resolved;
  }, [onMovePreview, onTransformPreviewChange, project.openings, project.walls, snapSizeMm]);

  const commitTransformPosition = useCallback((target: ModelTransformTarget, proposed: Point3Mm) => {
    const resolved = resolveTransformPosition(target, proposed);
    if (target.kind === "object") {
      onMove(target.id, resolved);
      onTransformPreviewChange?.(null);
      return;
    }
    const opening = project.openings.find((item) => item.id === target.id);
    const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
    if (!opening || !wall) return;
    onUpdateOpening?.(opening.id, {
      offsetMm: openingOffsetAtPoint(wall, resolved, opening.widthMm, snapSizeMm),
      sillHeightMm: Math.max(0, resolved.y),
    });
    onTransformPreviewChange?.(null);
  }, [onMove, onTransformPreviewChange, onUpdateOpening, project.openings, project.walls, resolveTransformPosition, snapSizeMm]);
  const activeCamera = scene.cameras.find((item) => item.id === activeCameraId)
    ?? scene.cameras[0] ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(
    camera.viewPreset, cameraHeightMm, fieldOfViewDegrees,
  );
  const exitWalkthrough = useCallback(() => camera.setViewPreset("dollhouse"), [camera.setViewPreset]);
  const hasSelection = selectedIds.length > 0 || Boolean(activeOpeningId) || Boolean(activeWallId);
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
