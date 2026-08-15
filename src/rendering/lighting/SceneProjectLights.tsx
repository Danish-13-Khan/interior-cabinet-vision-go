import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import { shadowMapSizePair } from "./shadowMapSizePair";

function degrees(value: number) {
  return value * Math.PI / 180;
}

/** Editable InteriorProject lights — kept compatible with existing light entities. */
export function SceneProjectLights({
  scene,
  shadowMapSize,
  shadowRadius,
}: {
  scene: CompiledLivingRoomScene;
  shadowMapSize: number;
  shadowRadius: number;
}) {
  return (
    <>
      {scene.lights.filter((light) => light.enabled).map((light) => {
        const position: [number, number, number] = [
          light.position.x / 1000,
          light.position.y / 1000,
          light.position.z / 1000,
        ];
        if (light.kind === "ambient") {
          return <ambientLight key={light.id} color={light.color} intensity={light.intensity * 0.58} />;
        }
        if (light.kind === "directional") {
          return (
            <directionalLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity * 0.86}
              castShadow={light.parameters.castShadow === true}
              shadow-mapSize={shadowMapSizePair(shadowMapSize)}
              shadow-bias={-0.00028}
              shadow-normalBias={0.04}
              shadow-radius={shadowRadius + 2}
              shadow-camera-near={0.1}
              shadow-camera-far={30}
              shadow-camera-left={-7}
              shadow-camera-right={7}
              shadow-camera-top={7}
              shadow-camera-bottom={-7}
            />
          );
        }
        if (light.kind === "point") {
          return (
            <pointLight
              key={light.id}
              position={position}
              color={light.color}
              intensity={light.intensity}
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
              intensity={light.intensity}
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
            intensity={light.intensity}
            width={Number(light.parameters.widthMm ?? 1200) / 1000}
            height={Number(light.parameters.heightMm ?? 900) / 1000}
          />
        );
      })}
    </>
  );
}
