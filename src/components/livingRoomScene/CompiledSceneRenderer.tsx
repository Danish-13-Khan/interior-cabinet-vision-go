import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MOUSE,
  ACESFilmicToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Point3Mm, RenderComposition, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import { resolveEnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { resolveRenderCameraPose } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { RenderLightingRig } from "../../rendering/lighting/RenderLightingRig";
import { CameraRig } from "./CameraRig";
import { CompiledNodeView } from "./CompiledNodeView";

type SceneRendererProps = {
  scene: CompiledLivingRoomScene;
  selectedIds: string[];
  activeCameraId: string | null;
  snapSizeMm: number;
  showGrid: boolean;
  cutawayWalls: boolean;
  interactive?: boolean;
  renderQuality?: RenderQuality;
  renderComposition?: RenderComposition;
  renderMode?: RenderMode;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
};

function RendererColorPipeline({ scene }: { scene: CompiledLivingRoomScene }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = scene.style.colorManagement.exposure;
    gl.shadowMap.type = scene.style.colorManagement.exposure > 1 ? PCFSoftShadowMap : PCFShadowMap;
  }, [gl, scene.style.colorManagement]);
  return null;
}

export function CompiledSceneRenderer({
  scene,
  selectedIds,
  activeCameraId,
  snapSizeMm,
  showGrid,
  cutawayWalls,
  interactive = true,
  renderQuality = "standard",
  renderComposition = "project-camera",
  renderMode = "preview",
  onSelect,
  onMove,
}: SceneRendererProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [dragging, setDragging] = useState(false);
  const materialMap = useMemo(
    () => new Map(scene.materials.map((material) => [material.id, material])),
    [scene.materials],
  );
  const projectCamera = scene.cameras.find((camera) => camera.id === activeCameraId)
    ?? scene.cameras.find((camera) => camera.isDefault)
    ?? scene.cameras[0];
  const renderCamera = projectCamera
    ? resolveRenderCameraPose(projectCamera, scene.bounds, renderComposition)
    : null;
  const cutawaySides = new Set([
    renderCamera && renderCamera.position.x < scene.bounds.center.x ? "left" : "right",
    renderCamera && renderCamera.position.z < scene.bounds.center.z ? "back" : "front",
  ]);
  const nodes = cutawayWalls
    ? scene.nodes.filter((node) => ![
        "wall",
        "opening",
      ].includes(String(node.metadata.role)) || !cutawaySides.has(String(node.metadata.wallSide)))
    : scene.nodes;
  const roomSpan = Math.max(scene.bounds.size.widthMm, scene.bounds.size.depthMm) / 1000;
  const environment = scene.style.environment;
  const lightingQuality = resolveEnvironmentLightingQuality(renderMode, renderQuality);

  return (
    <>
      <RendererColorPipeline scene={scene} />
      <CameraRig
        scene={scene}
        activeCameraId={activeCameraId}
        controlsRef={controlsRef}
        composition={renderComposition}
        renderMode={renderMode}
      />
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
          selected={Boolean(node.sourceObjectId && selectedIds.includes(node.sourceObjectId))}
          snapSizeMm={snapSizeMm}
          renderMode={renderMode}
          onSelect={onSelect}
          onMove={onMove}
          onDragStateChange={setDragging}
          interactive={interactive}
        />
      ))}
      <ContactShadows
        key={scene.fingerprint}
        position={[0, 0.004, 0]}
        scale={Math.max(8, roomSpan + 1)}
        opacity={environment.contactShadowOpacity * lightingQuality.contactShadowOpacityScale}
        blur={environment.contactShadowBlur * lightingQuality.contactShadowBlurScale}
        far={4}
        resolution={lightingQuality.contactShadowResolution}
        frames={1}
      />
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          enabled={!dragging}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.4}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.02}
          mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
        />
      ) : null}
    </>
  );
}
