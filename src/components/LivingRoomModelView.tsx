import { useCallback, useMemo, useState } from "react";
import type { InteriorProject, Point3Mm, RenderQuality } from "../domain/interiorProject";
import {
  compileLivingRoomScene,
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  getActiveLivingRoomStyleId,
  getCabinetMechanismState,
  getModelViewDefaultPresetId,
  getRenderQualityPreset,
  LIVING_ROOM_STYLE_PRESETS,
  listModelViewRenderPresets,
  mechanismFrontIndex,
  mechanismPanelPatch,
  modelViewProjectLightScale,
  modelViewWindowKeyScale,
  preferModelViewCameraId,
  resolveModelViewCameraOverrides,
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
import {
  ModelWallVisibilityHost,
  type WallContextMenuState,
} from "./livingRoomScene/ModelWallVisibilityHost";
import { ModelViewScene } from "./livingRoomScene/ModelViewScene";
import { ModelViewToolbar } from "./livingRoomScene/ModelViewToolbar";

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
  onSelect, onSelectOpening, onSelectWall, onClearSelection, onMove, onSetRotation,
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
  const [viewportQuality, setViewportQuality] = useState<RenderQuality>(getModelViewDefaultPresetId());
  const quality = getRenderQualityPreset(viewportQuality);
  const honesty = describeModelViewHonesty(viewportQuality);
  const activeStyleId = getActiveLivingRoomStyleId(project);
  const activeStyle = LIVING_ROOM_STYLE_PRESETS.find((style) => style.id === activeStyleId)!;
  const activeObject = selectedIds.length === 1
    ? project.objects.find((object) => object.id === selectedIds[0]) ?? null
    : null;
  const activeCamera = scene.cameras.find((item) => item.id === activeCameraId)
    ?? scene.cameras[0] ?? null;
  const diagnostics = useRenderDiagnostics(scene, activeCamera);
  const cameraOverrides = resolveModelViewCameraOverrides(
    camera.viewPreset, cameraHeightMm, fieldOfViewDegrees,
  );
  const exitWalkthrough = useCallback(() => camera.setViewPreset("dollhouse"), [camera.setViewPreset]);
  const hasSelection = selectedIds.length > 0 || Boolean(activeOpeningId) || Boolean(activeWallId);
  const fitSelection = { objectIds: selectedIds, wallId: activeWallId, openingId: activeOpeningId };

  return (
    <div
      className={`lr-model-viewport is-presence has-3d-onboarding${presentation ? " is-client-presentation" : ""}`}
      data-testid="lr-model-viewport"
      data-model-view-profile={JSON.stringify(describeModelViewRuntimeProfile(viewportQuality))}
      data-view-preset={camera.viewPreset}
    >
      {!presentation ? (
        <ModelViewToolbar
          viewPreset={camera.viewPreset} cameraHeightMm={cameraHeightMm}
          fieldOfViewDegrees={fieldOfViewDegrees} activeCameraId={activeCameraId}
          cameras={scene.cameras} activeStyleId={activeStyleId} cutawayWalls={cutawayWalls}
          activeRotation={activeObject ? Math.round(activeObject.rotation.y) : 0}
          hasActiveObject={Boolean(activeObject)} viewportQuality={viewportQuality}
          modelPresets={listModelViewRenderPresets()} honesty={honesty}
          onViewPreset={camera.setViewPreset} onCameraHeightMm={setCameraHeightMm}
          onFieldOfViewDegrees={setFieldOfViewDegrees} onActiveCameraId={setActiveCameraId}
          onApplyStyle={onApplyStyle} onCutawayWalls={setCutawayWalls}
          onSetRotation={(rotationY) => { if (activeObject) onSetRotation(activeObject.id, rotationY); }}
          onViewportQuality={setViewportQuality} onOpenGuide={() => setShowGuide(true)}
          hasSelection={hasSelection} onClearSelection={onClearSelection}
          onFitRoom={camera.fitRoom} onFocusSelection={camera.focusSelection}
        />
      ) : null}
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
          scene={scene} quality={quality} viewportQuality={viewportQuality}
          renderMode={resolveModelViewRenderMode()}
          lightingQuality={resolveModelViewLightingQuality(viewportQuality)}
          projectLightScale={modelViewProjectLightScale(viewportQuality)}
          windowKeyScale={modelViewWindowKeyScale(viewportQuality)}
          selectedIds={selectedIds} activeOpeningId={activeOpeningId} activeWallId={activeWallId}
          activeCameraId={activeCameraId} viewPreset={camera.viewPreset}
          cameraHeightMm={cameraOverrides.cameraHeightMm}
          fieldOfViewDegrees={cameraOverrides.fieldOfViewDegrees}
          snapSizeMm={snapSizeMm} showGrid={showGrid} cutawayWalls={cutawayWalls}
          fitVersion={camera.fitVersion} fitMode={camera.fitMode} fitSelection={fitSelection}
          onClearSelection={onClearSelection} onSelect={onSelect}
          onSelectOpening={onSelectOpening} onSelectWall={onSelectWall} onMove={onMove}
          onExitWalkthrough={exitWalkthrough}
          onWallContextMenu={(wallId, point) => setWallMenu({ wallId, ...point })}
          onMechanismClick={(objectId, primitiveId) => {
            const object = project.objects.find((item) => item.id === objectId);
            const state = object ? getCabinetMechanismState(object) : null;
            const index = mechanismFrontIndex(primitiveId);
            if (state && index !== null && index < state.count) {
              onSetParameters(objectId, mechanismPanelPatch(index, !state.open[index]));
            }
          }}
        />
      </div>
      {!presentation && onPatchDocument ? (
        <ModelWallVisibilityHost
          project={project} activeWallId={activeWallId} wallMenu={wallMenu}
          onCloseWallMenu={() => setWallMenu(null)} onPatchDocument={onPatchDocument}
          onSelectWall={onSelectWall} onClearSelection={onClearSelection}
        />
      ) : null}
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
