import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { resolveEnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { useModelReviewNodes } from "./useModelReviewNodes";
import { computeArchitectureBounds, resolveRenderCameraPose } from "../../domain/livingRoom";
import {
  resolveModelViewSelectionBoundsMm,
  type ModelViewFitMode,
  type ModelViewFitSelection,
} from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import { RenderLightingRig } from "../../rendering/lighting/RenderLightingRig";
import { CompiledSceneAtmosphere } from "./CompiledSceneAtmosphere";
import { CompiledSceneObjectLayer } from "./CompiledSceneObjectLayer";
import { ModelViewCameraKind } from "./ModelViewCameraKind";
import { ModelViewInteractionRig } from "./ModelViewInteractionRig";
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
  /** "ghost" keeps cut walls as translucent shells (live view); "remove" drops them (captures). */
  cutawayStyle?: "ghost" | "remove";
  /** Keep the ceiling slab in exterior presets (toolbar toggle). Client framing still drops it. */
  showCeiling?: boolean;
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
    cutawayStyle = "ghost", showCeiling = false, interactive = true, renderQuality = "standard", renderComposition = "project-camera",
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
  const { nodes, ghostIds, pickThroughIds } = useModelReviewNodes({
    scene, center: architectureBounds.center, renderCamera, viewPreset, cutawayWalls, cutawayStyle,
    showCeiling, interactive, frameRun, selectedOpeningId, selectedWallId, selectedLightId,
  });
  const glbCasterSlots = useMemo(() => assignGlbCasterSlots(nodes), [nodes]);
  const roomSpan = Math.max(architectureBounds.size.widthMm, architectureBounds.size.depthMm) / 1000;
  const inspection = resolveModelViewSelectionBoundsMm(scene, {
    objectIds: selectedIds,
    wallId: selectedWallId,
    openingId: selectedOpeningId,
  });
  const inspectionSpanMeters = inspection ? inspection.spanMm / 1000 : undefined;
  const lightingQuality = lightingQualityOverride
    ?? resolveEnvironmentLightingQuality(renderMode, renderQuality);
  const maxGlbCasters = lightingQuality.maxDirectionalCasters !== undefined
    ? resolveModelViewMaxGlbCasters(renderQuality) : undefined;

  return (
    <>
      {viewPreset ? <ModelViewCameraKind viewPreset={viewPreset} roomSpanMeters={roomSpan} /> : null}
      <CompiledSceneAtmosphere
        scene={scene}
        bounds={architectureBounds}
        frameRun={frameRun}
        lightingQuality={lightingQuality}
        roomLightScale={roomLightScale}
        roomSpan={roomSpan}
        showGrid={showGrid}
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
      <CompiledSceneObjectLayer
        nodes={nodes} ghostIds={ghostIds} pickThroughIds={pickThroughIds}
        materials={materialMap} selectedIds={selectedIds}
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
        renderMode={renderMode} lightingQuality={lightingQuality} environment={scene.style.environment}
        fitVersion={fitVersion} fitMode={fitMode} fitSelection={fitSelection}
        inspectionSpanMeters={inspectionSpanMeters}
        onExitWalkthrough={onExitWalkthrough}
        frameRun={frameRun}
      />
    </>
  );
}
