import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import type { ShadowCameraTuning } from "../../domain/livingRoom/shadowCameraTuning";
import { STUDIO_PROJECT_SHADOW } from "../../domain/livingRoom/shadowCameraTuning";
import { shadowMapSizePair } from "./shadowMapSizePair";

function degrees(value: number) {
  return value * Math.PI / 180;
}

/** Editable InteriorProject lights — kept compatible with existing light entities. */
export function SceneProjectLights({
  scene,
  shadowMapSize,
  shadowRadius,
  intensityScale = 1,
  shadowCamera,
}: {
  scene: CompiledLivingRoomScene;
  shadowMapSize: number;
  shadowRadius: number;
  intensityScale?: number;
  /** Policy A override; Studio omits → STUDIO_PROJECT_SHADOW. */
  shadowCamera?: ShadowCameraTuning;
}) {
  const cam = shadowCamera ?? STUDIO_PROJECT_SHADOW;
  const half = cam.frustumHalfExtent ?? 7;
  return (
    <>
      {scene.lights.filter((light) => light.enabled).map((light) => {
        const position: [number, number, number] = [
          light.position.x / 1000,
          light.position.y / 1000,
          light.position.z / 1000,
        ];
        if (light.kind === "ambient") {
          return <ambientLight key={light.id} color={light.color} intensity={light.intensity * 0.58 * intensityScale} />;
        }
        if (light.kind === "directional") {
          return (
            <directionalLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * 0.86 * intensityScale}
              castShadow={light.parameters.castShadow === true}
              shadow-mapSize={shadowMapSizePair(shadowMapSize)}
              shadow-bias={cam.bias}
              shadow-normalBias={cam.normalBias}
              shadow-radius={shadowRadius + cam.radiusExtra}
              shadow-camera-near={cam.near}
              shadow-camera-far={cam.far}
              shadow-camera-left={-half}
              shadow-camera-right={half}
              shadow-camera-top={half}
              shadow-camera-bottom={-half}
            />
          );
        }
        if (light.kind === "point") {
          return (
            <pointLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * intensityScale}
              distance={Number(light.parameters.rangeMm ?? 5000) / 1000}
              castShadow
              shadow-radius={shadowRadius}
            />
          );
        }
        if (light.kind === "spot") {
          return (
            <spotLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * intensityScale}
              angle={Math.PI / 4}
              penumbra={0.5}
              castShadow
              shadow-radius={shadowRadius}
            />
          );
        }
        return (
          <rectAreaLight
            key={light.id}
            position={position}
            rotation={[degrees(light.rotation.x), degrees(light.rotation.y), degrees(light.rotation.z)]}
            color={light.color}
            intensity={light.intensity * intensityScale}
            width={Number(light.parameters.widthMm ?? 1200) / 1000}
            height={Number(light.parameters.heightMm ?? 900) / 1000}
          />
        );
      })}
    </>
  );
}
