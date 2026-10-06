import { useLayoutEffect, useRef } from "react";
import type { DirectionalLight } from "three";
import type { LightEntity } from "../../domain/interiorProject";
import type { ShadowCameraTuning } from "../../domain/livingRoom/shadowCameraTuning";
import { shadowMapSizePair } from "./shadowMapSizePair";

/** Directional recipe light. An off-centre room aims it at that room's centre. */
export function DirectionalProjectLight({
  light,
  position,
  intensity,
  castShadow,
  shadowMapSize,
  shadowRadius,
  cam,
  half,
}: {
  light: LightEntity;
  position: [number, number, number];
  intensity: number;
  castShadow: boolean;
  shadowMapSize: number;
  shadowRadius: number;
  cam: ShadowCameraTuning;
  half: number;
}) {
  const ref = useRef<DirectionalLight>(null);
  const targetX = light.parameters.targetXMm;
  const targetZ = light.parameters.targetZMm;
  useLayoutEffect(() => {
    const current = ref.current;
    if (!current || typeof targetX !== "number" || typeof targetZ !== "number") return;
    current.target.position.set(targetX / 1000, 0, targetZ / 1000);
    current.target.updateMatrixWorld();
  }, [targetX, targetZ]);
  return (
    <directionalLight
      ref={ref}
      position={position}
      color={light.color}
      intensity={intensity}
      castShadow={castShadow}
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
