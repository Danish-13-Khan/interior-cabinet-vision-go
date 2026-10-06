import type { ModelViewPresetId } from "../../domain/livingRoom";
import { stoppingTourFirst } from "../../domain/apartmentTemplates/showcaseTourView";
import { apartmentOverviewAvailable } from "../../domain/livingRoom/overviewCameras";
import { persistModelGuideDismissal } from "../../domain/livingRoom/modelViewGuidePreference";
import { ApartmentOverviewControls, ApartmentOverviewVeil } from "./ApartmentOverviewControls";
import type { LivingRoomModelViewportProps } from "./livingRoomModelViewportProps";
import { ApartmentRoomPick } from "./ApartmentRoomPick";
import { CabinetSceneSemantics } from "./CabinetSceneSemantics";
import { LivingRoomModelChrome } from "./LivingRoomModelChrome";
import { ModelViewAuthoringOverlays } from "./ModelViewAuthoringOverlays";
import { ModelViewFeedbackBanners } from "./ModelViewFeedbackBanners";
import { ModelViewScene } from "./ModelViewScene";
import { PlanTraceRaisePrompt } from "./PlanTraceEmptyState";
import { ShowcaseTourControls } from "./ShowcaseTourControls";

const quiet = () => {};

/** Model View shell: room scene, or the whole apartment when that mode is on. */
export function LivingRoomModelViewport(props: LivingRoomModelViewportProps) {
  const { handlers, camera, tour, scene, overview, transform, presentation, viewOnly } = props;
  const { project } = handlers;
  const apartment = overview.showApartment || tour.touringOverview;
  const roomName = project.rooms.find((room) => room.id === props.hoveredRoomId)?.name ?? null;
  const extruded = scene.nodes.filter((node) => node.metadata.role === "wall" && node.metadata.planTrace !== true).length;
  const choosePreset = (preset: ModelViewPresetId) => { if (!apartment) camera.setViewPreset(preset); };
  return (
    <div
      className={`lr-model-viewport is-presence has-3d-onboarding${presentation ? " is-client-presentation" : ""}`}
      data-testid="lr-model-viewport"
      data-model-view-profile={JSON.stringify(props.profile)}
      data-view-preset={camera.viewPreset}
      data-scene-height-mm={Math.round(scene.bounds.size.heightMm)}
      data-extruded-walls={extruded}
      data-ceiling-hidden={props.ceilingHidden ? "1" : "0"}
      data-near-wall-cut={props.nearWallCut ? "1" : "0"}
      data-active-room-id={project.activeRoomId}
      data-overview-phase={overview.phase}
      data-overview-room-id={props.hoveredRoomId ?? ""}
    >
      {!presentation ? (
        <ModelViewAuthoringOverlays
          project={project} activeWallId={handlers.activeWallId} wallMenu={props.wallMenu}
          viewPreset={camera.viewPreset} cameraHeightMm={props.cameraHeightMm}
          fieldOfViewDegrees={props.fieldOfViewDegrees} activeCameraId={props.activeCameraId}
          cameras={scene.cameras} cutawayWalls={props.cutawayWalls}
          activeRotation={transform.activeObject ? Math.round(transform.activeObject.rotation.y) : 0}
          hasActiveObject={Boolean(transform.activeObject)} viewportQuality={props.viewportQuality}
          honesty={props.honesty} hasSelection={handlers.selectedIds.length > 0}
          onViewPreset={choosePreset} onCameraHeightMm={props.onCameraHeightMm}
          onFieldOfViewDegrees={props.onFieldOfViewDegrees}
          onActiveCameraId={stoppingTourFirst(tour.stop, props.onActiveCameraId)}
          onCutawayWalls={props.onCutawayWalls} onSetRotation={props.onRotate}
          onViewportQuality={props.onViewportQuality} onOpenGuide={() => props.onShowGuide(true)}
          onClearSelection={viewOnly ? quiet : props.onClearSelection}
          onFitRoom={stoppingTourFirst(tour.stop, apartment ? () => overview.chooseCorner("ne") : camera.fitRoom)}
          onFocusSelection={camera.focusSelection} onCloseWallMenu={() => props.onWallMenu(null)}
          onSelectWall={handlers.onSelectWall} onSelectLight={handlers.onSelectLight}
          lightActions={handlers.lightActions} onPatchDocument={props.onPatchDocument}
        />
      ) : null}
      {!presentation ? <ModelViewFeedbackBanners /> : null}
      <div
        ref={props.canvasHostRef}
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
          scene={scene} viewportQuality={props.viewportQuality}
          renderMode={props.renderMode} lightingQuality={props.lightingQuality}
          projectLightScale={props.lightScale} windowKeyScale={props.windowScale}
          roomLightScale={props.roomLightScale}
          selectedIds={props.clientView.selectedIds}
          activeOpeningId={props.clientView.activeOpeningId} activeWallId={props.clientView.activeWallId}
          selectedLightId={viewOnly ? null : props.activeLightId}
          onSelectLight={viewOnly ? quiet : handlers.onSelectLight}
          onMoveLight={presentation ? undefined : handlers.lightActions?.moveLight}
          activeCameraId={props.activeCameraId} viewPreset={camera.viewPreset}
          cameraHeightMm={props.cameraOverrides.cameraHeightMm}
          fieldOfViewDegrees={props.cameraOverrides.fieldOfViewDegrees}
          snapSizeMm={props.snapSizeMm} showGrid={props.clientView.showGrid} cutawayWalls={props.cutawayWalls}
          interactive={props.clientView.interactive}
          frameRun={apartment ? undefined : tour.frameRun}
          renderComposition={apartment ? "project-camera" : tour.composition}
          fitVersion={camera.fitVersion} fitMode={camera.fitMode}
          fitSelection={{ objectIds: handlers.selectedIds, wallId: handlers.activeWallId, openingId: handlers.activeOpeningId }}
          onClearSelection={viewOnly ? quiet : props.onClearSelection}
          onSelect={viewOnly ? quiet : props.onSelect}
          onSelectOpening={viewOnly ? quiet : handlers.onSelectOpening}
          onSelectWall={viewOnly ? quiet : handlers.onSelectWall}
          onMove={handlers.onMove}
          transformTarget={viewOnly ? null : transform.transformTarget}
          onTransformPreview={transform.resolveTransformPosition}
          onTransformCommit={transform.commitTransformPosition}
          onExitWalkthrough={() => camera.setViewPreset("dollhouse")}
          onWallContextMenu={viewOnly ? undefined : (wallId, point) => props.onWallMenu({ wallId, ...point })}
          onMechanismClick={props.onMechanism}
          instanceRepeatedModels={apartment}
          overlay={apartment ? (
            <ApartmentRoomPick
              project={project} hoveredId={props.hoveredRoomId}
              onHover={props.onHoverRoom} onActivate={props.onActivateRoom}
            />
          ) : null}
        />
        <ApartmentOverviewVeil show={overview.phase === "warming-in" || overview.phase === "warming-out"} onDismiss={() => overview.leave(false)} />
        {!presentation ? <PlanTraceRaisePrompt project={project} onPatchDocument={props.onPatchDocument} /> : null}
      </div>
      <ApartmentOverviewControls
        available={!presentation && apartmentOverviewAvailable(project.rooms.length) && !tour.tour.active}
        phase={overview.phase} corner={overview.corner} roomName={roomName}
        onEnter={overview.enter} onLeave={() => overview.leave(false)} onCorner={overview.chooseCorner}
      />
      <ShowcaseTourControls
        available={tour.available && overview.phase === "idle"} stops={tour.stops} tour={tour.tour}
        mood={tour.mood} showMood={tour.showMood} onStart={tour.start} onStop={tour.stop} onMood={tour.setMood}
      />
      {!presentation ? (
        <LivingRoomModelChrome
          showGuide={props.showGuide} viewPreset={camera.viewPreset}
          onChoosePreset={choosePreset}
          onResetCamera={apartment ? () => overview.chooseCorner("ne") : camera.resetView}
          onDismissGuide={() => { props.onShowGuide(false); persistModelGuideDismissal(); }}
          diagnostics={props.diagnostics} activeObject={transform.activeObject}
          onSetParameters={props.onSetParameters} activeStyleId={props.activeStyleId}
          activeStyleName={props.activeStyleName} onApplyStyle={props.onApplyStyle}
          honestyBadge={props.honesty.shortBadge} exposure={scene.style.colorManagement.exposure}
          planTraceHint={props.planTrace} showStylePalette={props.showStylePalette}
        />
      ) : null}
      <CabinetSceneSemantics project={project} />
    </div>
  );
}
