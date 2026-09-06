import { useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { resolveEnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { filterModelReviewNodes, resolveModelCutawaySides } from "../../domain/livingRoom/modelReviewNodes";
import { computeArchitectureBounds, resolveRenderCameraPose } from "../../domain/livingRoom";
import type { ModelViewFitMode, ModelViewFitSelection } from "../../domain/livingRoom/modelViewFit";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { RenderLightingRig } from "../../rendering/lighting/RenderLightingRig";
import { CompiledNodeView } from "./CompiledNodeView";
import { ModelViewCameraKind } from "./ModelViewCameraKind";
import { ModelViewInteractionRig } from "./ModelViewInteractionRig";
import { RendererColorPipeline } from "./RendererColorPipeline";
import { modelNodeIsSelected, modelSelectionTarget } from "../../domain/livingRoom/modelSelection";

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
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening?: (openingId: string) => void;
  onSelectWall?: (wallId: string) => void;
  onClearSelection?: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onExitWalkthrough?: () => void;
  fitVersion?: number;
  fitMode?: ModelViewFitMode;
  fitSelection?: ModelViewFitSelection;
};

function wallFragmentArea(node: CompiledLivingRoomScene["nodes"][number]) {
  return node.primitives.reduce((area, primitive) => {
    if (primitive.kind !== "box" && primitive.kind !== "rounded-box") return area;
    return area + primitive.sizeMm.width * primitive.sizeMm.height;
  }, 0);
}

export function CompiledSceneRenderer(props: SceneRendererProps) {
  const {
    scene, selectedIds, selectedOpeningId = null, selectedWallId = null, activeCameraId,
    viewPreset, cameraHeightMm, fieldOfViewDegrees, snapSizeMm, showGrid, cutawayWalls,
    interactive = true, renderQuality = "standard", renderComposition = "project-camera",
    renderMode = "preview", lightingQuality: lightingQualityOverride, projectLightScale = 1,
    windowKeyScale = 1, onSelect, onSelectOpening = () => {}, onSelectWall = () => {},
    onClearSelection = () => onSelect(null), onMove, onMechanismClick, onExitWalkthrough,
    fitVersion = 0, fitMode = "room", fitSelection,
  } = props;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [dragging, setDragging] = useState(false);
  const [assetRevision, setAssetRevision] = useState(0);
  const architectureBounds = computeArchitectureBounds(scene.nodes);
  const materialKey = scene.materials
    .map((material) => `${material.id}:${material.color}:${material.roughness}:${material.metalness}:${material.uvScaleMm}:${material.uvRotationDeg}:${material.textureMapUrl ?? ""}`)
    .join("|");
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
  const cutawaySides = resolveModelCutawaySides(
    renderCamera?.position ?? null,
    architectureBounds.center,
  );
  const hideCeiling = viewPreset === "dollhouse"
    || viewPreset === "orbit"
    || viewPreset === "top"
    || viewPreset === "isometric";
  const nodes = filterModelReviewNodes(
    scene.nodes, cutawayWalls, cutawaySides, selectedOpeningId, hideCeiling, selectedWallId,
  );
  const selectedWallLabelNodeId = selectedWallId
    ? nodes
      .filter((node) => modelSelectionTarget(node)?.kind === "wall"
        && node.metadata.wallId === selectedWallId)
      .sort((left, right) => wallFragmentArea(right) - wallFragmentArea(left))[0]?.id ?? null
    : null;
  const roomSpan = Math.max(architectureBounds.size.widthMm, architectureBounds.size.depthMm) / 1000;
  const environment = scene.style.environment;
  const lightingQuality = lightingQualityOverride
    ?? resolveEnvironmentLightingQuality(renderMode, renderQuality);

  return (
    <>
      {viewPreset ? <ModelViewCameraKind viewPreset={viewPreset} /> : null}
      <RendererColorPipeline exposure={scene.style.colorManagement.exposure} />
      <color attach="background" args={[environment.backgroundColor]} />
      <fog attach="fog" args={[environment.fogColor, environment.fogNearMm / 1000, environment.fogFarMm / 1000]} />
      <hemisphereLight
        color={environment.hemisphereSkyColor}
        groundColor={environment.hemisphereGroundColor}
        intensity={environment.hemisphereIntensity * lightingQuality.hemisphereScale}
      />
      <RenderLightingRig
        scene={scene}
        recipeId={scene.lightingRecipeId}
        renderMode={renderMode}
        renderQuality={renderQuality}
        lightingQuality={lightingQuality}
        projectLightScale={projectLightScale}
        windowKeyScale={windowKeyScale}
      />
      {showGrid ? (
        <gridHelper
          args={[
            Math.max(8, roomSpan + 2),
            Math.max(16, Math.round((roomSpan + 2) * 2)),
            environment.gridPrimaryColor,
            environment.gridSecondaryColor,
          ]}
          position={[0, 0.002, 0]}
        />
      ) : null}
      {nodes.map((node) => (
        <CompiledNodeView
          key={node.id}
          node={node}
          materials={materialMap}
          selected={modelNodeIsSelected(node, {
            objectIds: selectedIds,
            openingId: selectedOpeningId,
            wallId: selectedWallId,
          })}
          snapSizeMm={snapSizeMm}
          renderMode={renderMode}
          renderQuality={renderQuality}
          showSelectedLabel={modelSelectionTarget(node)?.kind !== "wall"
            || node.id === selectedWallLabelNodeId}
          onSelect={onSelect}
          onSelectOpening={onSelectOpening}
          onSelectWall={onSelectWall}
          onClearSelection={onClearSelection}
          onMove={onMove}
          onDragStateChange={setDragging}
          interactive={interactive}
          onMechanismClick={onMechanismClick}
          onAssetReady={() => setAssetRevision((revision) => revision + 1)}
        />
      ))}
      <ModelViewInteractionRig
        scene={scene}
        controlsRef={controlsRef}
        activeCameraId={activeCameraId}
        viewPreset={viewPreset}
        cameraHeightMm={cameraHeightMm}
        fieldOfViewDegrees={fieldOfViewDegrees}
        assetRevision={assetRevision}
        interactive={interactive}
        dragging={dragging}
        roomSpan={roomSpan}
        renderQuality={renderQuality}
        renderComposition={renderComposition}
        renderMode={renderMode}
        lightingQuality={lightingQuality}
        environment={environment}
        fitVersion={fitVersion}
        fitMode={fitMode}
        fitSelection={fitSelection}
        onExitWalkthrough={onExitWalkthrough}
      />
    </>
  );
}
