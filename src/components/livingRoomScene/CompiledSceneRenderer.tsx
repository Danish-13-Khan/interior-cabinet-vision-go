import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { resolveEnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { filterModelReviewNodes, modelViewCutsNearWall, modelViewHidesCeiling, resolveModelCutawaySides } from "../../domain/livingRoom/modelReviewNodes";
import { useOrbitCutawaySides } from "./useOrbitCutawaySides";
import { computeArchitectureBounds, resolveRenderCameraPose } from "../../domain/livingRoom";
import {
  resolveModelViewSelectionBoundsMm,
  type ModelViewFitMode,
  type ModelViewFitSelection,
} from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { resolveCabinetRunFrame, type CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import { MODEL_VIEW_STAGE_COLOR } from "../../domain/livingRoom/modelViewStage";
import { RenderLightingRig } from "../../rendering/lighting/RenderLightingRig";
import { CompiledSceneObjectLayer } from "./CompiledSceneObjectLayer";
import { ModelViewCameraKind } from "./ModelViewCameraKind";
import { ModelViewInteractionRig } from "./ModelViewInteractionRig";
import { RendererColorPipeline } from "./RendererColorPipeline";
import { modelViewFogMeters } from "../../domain/livingRoom/modelViewExteriorFrame";
import { assignGlbCasterSlots } from "../../domain/livingRoom/glbCastShadow";
import { resolveModelViewMaxGlbCasters } from "../../domain/livingRoom/modelViewPerf";
import type { ModelTransformTarget } from "./ModelMoveGizmo";

type SceneRendererProps = {
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  selectedOpeningId?: string | null;
  selectedWallId?: string | null;
  activeCameraId: string | null;
  viewPreset?: ModelViewPresetId;
  cameraHeightMm?: number;
  fieldOfViewDegrees?: number;
  snapSizeMm: number;
  showGrid: boolean;
  cutawayWalls: boolean;
  interactive?: boolean;
  renderQuality?: RenderQuality;
  renderComposition?: RenderComposition;
  renderMode?: RenderMode;
  lightingQuality?: EnvironmentLightingQuality;
  projectLightScale?: number;
  windowKeyScale?: number;
  /** Lighting mood multiplier for room light. Fixtures are not scaled. */
  roomLightScale?: number;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening?: (openingId: string) => void;
  onSelectWall?: (wallId: string) => void;
  onClearSelection?: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onExitWalkthrough?: () => void;
  onWallContextMenu?: (wallId: string, point: { x: number; y: number }) => void;
  fitVersion?: number;
  fitMode?: ModelViewFitMode;
  fitSelection?: ModelViewFitSelection;
  transformTarget?: ModelTransformTarget | null;
  onTransformPreview?: (target: ModelTransformTarget, position: Point3Mm) => Point3Mm;
  onTransformCommit?: (target: ModelTransformTarget, position: Point3Mm) => void;
  /** Frame the cabinet run: "author" on Dollhouse entry, "client" for Present. */
  frameRun?: CabinetRunAudience;
  /** Forwarded to fixtures. Render Studio does not pass these. */
  selectedLightId?: string | null;
  onSelectLight?: (id: string) => void;
  onMoveLight?: (id: string, point: { x: number; y: number; z: number }) => void;
};

export function CompiledSceneRenderer(props: SceneRendererProps) {
  const {
    scene, selectedIds, selectedOpeningId = null, selectedWallId = null, activeCameraId,
    viewPreset, cameraHeightMm, fieldOfViewDegrees, snapSizeMm, showGrid, cutawayWalls,
    interactive = true, renderQuality = "standard", renderComposition = "project-camera",
    renderMode = "preview", lightingQuality: lightingQualityOverride, projectLightScale = 1,
    windowKeyScale = 1, roomLightScale = 1, onSelect, onSelectOpening = () => {}, onSelectWall = () => {},
    onClearSelection = () => onSelect(null), onMove, onMechanismClick, onExitWalkthrough,
    onWallContextMenu, fitVersion = 0, fitMode = "room", fitSelection,
    transformTarget = null, onTransformPreview, onTransformCommit, frameRun,
    selectedLightId = null, onSelectLight, onMoveLight,
  } = props;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [dragging, setDragging] = useState(false);
  const [assetRevision, setAssetRevision] = useState(0);
  const [transformPreview, setTransformPreview] = useState<Point3Mm | null>(null);
  useEffect(() => setTransformPreview(null), [transformTarget?.kind, transformTarget?.id]);
  function handleDragStateChange(nextDragging: boolean) {
    if (controlsRef.current) controlsRef.current.enabled = !nextDragging;
    setDragging(nextDragging);
  }
  const architectureBounds = computeArchitectureBounds(scene.nodes);
  const materialKey = scene.materials.map((material) => JSON.stringify(material)).join("|");
  const materialMap = useMemo(
    () => new Map(scene.materials.map((material) => [material.id, material])),
    [materialKey],
  );
  const projectCamera = scene.cameras.find((camera) => camera.id === activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const renderCamera = projectCamera
    ? resolveRenderCameraPose(projectCamera, architectureBounds, renderComposition, renderMode)
    : null;
  const savedCutawaySides = resolveModelCutawaySides(
    renderCamera?.position ?? null, architectureBounds.center,
  );
  const cutNearWall = modelViewCutsNearWall(viewPreset);
  const orbitCutawaySides = useOrbitCutawaySides(
    (cutawayWalls && interactive) || cutNearWall,
    architectureBounds.center.x, architectureBounds.center.z,
    renderCamera?.position.x ?? null, renderCamera?.position.z ?? null,
  );
  const clientCutaway = useMemo(
    () => (frameRun === "client"
      ? resolveCabinetRunFrame(scene, { widthPx: 16, heightPx: 9 }, { audience: "client" })?.cutawaySides ?? null
      : null),
    [scene, frameRun],
  );
  const cutawaySides = clientCutaway
    ?? ((cutawayWalls && interactive) || cutNearWall ? orbitCutawaySides : savedCutawaySides);
  const hideCeiling = modelViewHidesCeiling(viewPreset) || Boolean(clientCutaway);
  // A selected wall light keeps its host wall standing, as selecting the wall would.
  const selectedLightHost = selectedLightId
    ? scene.lights.find((light) => light.id === selectedLightId)?.parameters.hostWallId
    : undefined;
  const lightHostWallId = typeof selectedLightHost === "string" ? selectedLightHost : null;
  const nodes = filterModelReviewNodes(
    scene.nodes, cutawayWalls || cutNearWall || Boolean(clientCutaway), cutawaySides,
    selectedOpeningId, hideCeiling, selectedWallId ?? lightHostWallId,
  );
  const glbCasterSlots = useMemo(() => assignGlbCasterSlots(nodes), [nodes]);
  const roomSpan = Math.max(architectureBounds.size.widthMm, architectureBounds.size.depthMm) / 1000;
  const fog = modelViewFogMeters(roomSpan, scene.style.environment.fogNearMm, scene.style.environment.fogFarMm);
  const inspection = resolveModelViewSelectionBoundsMm(scene, {
    objectIds: selectedIds,
    wallId: selectedWallId,
    openingId: selectedOpeningId,
  });
  const inspectionSpanMeters = inspection ? inspection.spanMm / 1000 : undefined;
  const environment = scene.style.environment;
  const lightingQuality = lightingQualityOverride
    ?? resolveEnvironmentLightingQuality(renderMode, renderQuality);
  const maxGlbCasters = lightingQuality.maxDirectionalCasters !== undefined
    ? resolveModelViewMaxGlbCasters(renderQuality) : undefined;

  return (
    <>
      {viewPreset ? <ModelViewCameraKind viewPreset={viewPreset} roomSpanMeters={roomSpan} /> : null}
      <RendererColorPipeline exposure={scene.style.colorManagement.exposure} />
      <color attach="background" args={[frameRun ? MODEL_VIEW_STAGE_COLOR : environment.backgroundColor]} />
      <fog attach="fog" args={[frameRun ? MODEL_VIEW_STAGE_COLOR : environment.fogColor, fog.near, fog.far]} />
      <hemisphereLight
        color={environment.hemisphereSkyColor}
        groundColor={environment.hemisphereGroundColor}
        intensity={environment.hemisphereIntensity * lightingQuality.hemisphereScale * roomLightScale}
      />
      <RenderLightingRig
        scene={scene} recipeId={scene.lightingRecipeId} renderMode={renderMode}
        renderQuality={renderQuality} lightingQuality={lightingQuality}
        projectLightScale={projectLightScale} windowKeyScale={windowKeyScale}
        roomLightScale={roomLightScale}
        selectedLightId={selectedLightId} onSelectLight={onSelectLight}
        onMoveLight={interactive ? onMoveLight : undefined}
        onLightDragState={handleDragStateChange}
      />
      {showGrid ? (
        <gridHelper
          args={[
            Math.max(8, roomSpan + 2), Math.max(16, Math.round((roomSpan + 2) * 2)),
            environment.gridPrimaryColor, environment.gridSecondaryColor,
          ]}
          position={[0, 0.002, 0]}
        />
      ) : null}
      <CompiledSceneObjectLayer
        nodes={nodes} materials={materialMap} selectedIds={selectedIds}
        selectedOpeningId={selectedOpeningId} selectedWallId={selectedWallId}
        lightSelected={Boolean(selectedLightId)}
        snapSizeMm={snapSizeMm} renderMode={renderMode} renderQuality={renderQuality}
        glbCasterSlots={glbCasterSlots} maxGlbCasters={maxGlbCasters}
        interactive={interactive} transformTarget={transformTarget}
        transformPreview={transformPreview} setTransformPreview={setTransformPreview}
        onSelect={onSelect} onSelectOpening={onSelectOpening} onSelectWall={onSelectWall}
        onClearSelection={onClearSelection} onMove={onMove}
        onTransformPreview={onTransformPreview} onTransformCommit={onTransformCommit}
        onDragStateChange={handleDragStateChange} onMechanismClick={onMechanismClick}
        onAssetReady={() => setAssetRevision((revision) => revision + 1)}
        onWallContextMenu={onWallContextMenu}
      />
      <ModelViewInteractionRig
        scene={scene} controlsRef={controlsRef} activeCameraId={activeCameraId}
        viewPreset={viewPreset} cameraHeightMm={cameraHeightMm}
        fieldOfViewDegrees={fieldOfViewDegrees} assetRevision={assetRevision}
        interactive={interactive} dragging={dragging} roomSpan={roomSpan}
        renderQuality={renderQuality} renderComposition={renderComposition}
        renderMode={renderMode} lightingQuality={lightingQuality} environment={environment}
        fitVersion={fitVersion} fitMode={fitMode} fitSelection={fitSelection}
        inspectionSpanMeters={inspectionSpanMeters}
        onExitWalkthrough={onExitWalkthrough}
        frameRun={frameRun}
      />
    </>
  );
}
