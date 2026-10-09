import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Fog } from "three";
import type { CabinetRunAudience } from "../../domain/livingRoom/cabinetRunFrame";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { modelViewFogMeters } from "../../domain/livingRoom/modelViewExteriorFrame";
import { environmentScaleForRoomLight } from "../../domain/livingRoom/lightingMood";
import { cameraInsideRoomMeters } from "../../domain/livingRoom/modelViewRoomFog";
import { MODEL_VIEW_STAGE_COLOR } from "../../domain/livingRoom/modelViewStage";
import type { CompiledLivingRoomScene, CompiledSceneBounds } from "../../domain/livingRoom/sceneTypes";
import { RendererColorPipeline } from "./RendererColorPipeline";

function RoomFog({
  color, bounds, near, far,
}: {
  color: string;
  bounds: CompiledSceneBounds;
  near: number;
  far: number;
}) {
  const scene = useThree((state) => state.scene);
  const fog = useRef(new Fog(color, near, far));
  useLayoutEffect(() => {
    fog.current.color.set(color);
    fog.current.near = near;
    fog.current.far = far;
  }, [color, near, far]);
  useFrame(({ camera }) => {
    scene.fog = cameraInsideRoomMeters(camera.position, bounds) ? null : fog.current;
  });
  useEffect(() => () => {
    scene.fog = null;
  }, [scene]);
  return null;
}

/** Background, fog, and fill. Fog stays off while the camera is inside the room. */
export function CompiledSceneAtmosphere({
  scene, bounds, frameRun, lightingQuality, roomLightScale, roomSpan, showGrid,
}: {
  scene: CompiledLivingRoomScene;
  bounds: CompiledSceneBounds;
  frameRun?: CabinetRunAudience;
  lightingQuality: EnvironmentLightingQuality;
  roomLightScale: number;
  roomSpan: number;
  showGrid: boolean;
}) {
  const environment = scene.style.environment;
  const fog = modelViewFogMeters(roomSpan, environment.fogNearMm, environment.fogFarMm);
  const backdrop = frameRun ? MODEL_VIEW_STAGE_COLOR : environment.backgroundColor;
  const fogColor = frameRun ? MODEL_VIEW_STAGE_COLOR : environment.fogColor;
  return (
    <>
      <RendererColorPipeline
        exposure={scene.style.colorManagement.exposure}
        toneMapping={scene.style.colorManagement.toneMapping}
      />
      <color attach="background" args={[backdrop]} />
      <RoomFog color={fogColor} bounds={bounds} near={fog.near} far={fog.far} />
      <hemisphereLight
        color={environment.hemisphereSkyColor}
        groundColor={environment.hemisphereGroundColor}
        intensity={environment.hemisphereIntensity * lightingQuality.hemisphereScale * environmentScaleForRoomLight(roomLightScale)}
      />
      {showGrid ? (
        <gridHelper
          args={[
            Math.max(8, roomSpan + 2), Math.max(16, Math.round((roomSpan + 2) * 2)),
            environment.gridPrimaryColor, environment.gridSecondaryColor,
          ]}
          // Just under the floor top (y = 0): the floor slab hides it inside the room so it
          // never paints over tile or wood, and it still reads as ground outside the room.
          position={[scene.bounds.center.x / 1000, -0.002, scene.bounds.center.z / 1000]}
        />
      ) : null}
    </>
  );
}
