import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MOUSE,
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene, ModelViewPresetId } from "../../domain/livingRoom";
import { resolveEnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { filterModelReviewNodes } from "../../domain/livingRoom/modelReviewNodes";
import { computeArchitectureBounds, resolveRenderCameraPose } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { RenderLightingRig } from "../../rendering/lighting/RenderLightingRig";
import { CameraRig } from "./CameraRig";
import { CompiledNodeView } from "./CompiledNodeView";
import { WalkthroughNavigation } from "./WalkthroughNavigation";

type SceneRendererProps = {
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  selectedOpeningId?: string | null;
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
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening?: (openingId: string) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onExitWalkthrough?: () => void;
};

function RendererColorPipeline({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
    if (gl.shadowMap.type !== PCFShadowMap) gl.shadowMap.type = PCFShadowMap;
  }, [exposure, gl]);
  return null;
}

export function CompiledSceneRenderer({
  scene,
  selectedIds,
  selectedOpeningId = null,
  activeCameraId,
  viewPreset,
  cameraHeightMm,
  fieldOfViewDegrees,
  snapSizeMm,
  showGrid,
  cutawayWalls,
  interactive = true,
  renderQuality = "standard",
  renderComposition = "project-camera",
  renderMode = "preview",
  onSelect,
  onSelectOpening = () => {},
  onMove,
  onMechanismClick,
  onExitWalkthrough,
}: SceneRendererProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [dragging, setDragging] = useState(false);
  const [assetRevision, setAssetRevision] = useState(0);
  const architectureBounds = computeArchitectureBounds(scene.nodes);
  const materialKey = scene.materials
    .map((material) => `${material.id}:${material.color}:${material.roughness}:${material.metalness}:${material.uvScaleMm}`)
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
  const cutawaySides = new Set([
    renderCamera && renderCamera.position.x < architectureBounds.center.x ? "left" : "right",
    renderCamera && renderCamera.position.z < architectureBounds.center.z ? "back" : "front",
  ]);
  const nodes = filterModelReviewNodes(
    scene.nodes, cutawayWalls, cutawaySides, selectedOpeningId,
  );
  const roomSpan = Math.max(architectureBounds.size.widthMm, architectureBounds.size.depthMm) / 1000;
  const environment = scene.style.environment;
  const lightingQuality = resolveEnvironmentLightingQuality(renderMode, renderQuality);

  return (
    <>
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
          selected={Boolean((node.sourceObjectId && selectedIds.includes(node.sourceObjectId))
            || node.metadata.openingId === selectedOpeningId)}
          snapSizeMm={snapSizeMm}
          renderMode={renderMode}
          renderQuality={renderQuality}
          onSelect={onSelect}
          onSelectOpening={onSelectOpening}
          onMove={onMove}
          onDragStateChange={setDragging}
          interactive={interactive}
          onMechanismClick={onMechanismClick}
          onAssetReady={() => setAssetRevision((revision) => revision + 1)}
        />
      ))}
      <ContactShadows
        key={`${renderQuality}-${renderMode}`}
        position={[0, lightingQuality.contactShadowHeightOffsetMeters, 0]}
        scale={Math.max(8, roomSpan + 1)}
        opacity={environment.contactShadowOpacity * lightingQuality.contactShadowOpacityScale}
        blur={environment.contactShadowBlur * lightingQuality.contactShadowBlurScale}
        far={lightingQuality.contactShadowFarMeters}
        resolution={lightingQuality.contactShadowResolution}
        frames={lightingQuality.contactShadowFrames}
      />
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!dragging}
          enableDamping
          dampingFactor={0.08}
          enablePan={viewPreset !== "walkthrough"}
          enableZoom={viewPreset !== "walkthrough"}
          minDistance={1.4}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.02}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
            RIGHT: viewPreset === "walkthrough" ? MOUSE.ROTATE : MOUSE.PAN,
          }}
        />
      ) : null}
      <CameraRig
        scene={scene}
        activeCameraId={activeCameraId}
        controlsRef={controlsRef}
        composition={renderComposition}
        renderMode={renderMode}
        viewPreset={viewPreset}
        cameraHeightMm={cameraHeightMm}
        fieldOfViewDegrees={fieldOfViewDegrees}
        assetRevision={assetRevision}
      />
      <WalkthroughNavigation
        enabled={interactive && viewPreset === "walkthrough"}
        onExit={onExitWalkthrough}
      />
    </>
  );
}
