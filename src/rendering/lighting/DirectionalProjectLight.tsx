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
  const targetY = light.parameters.targetYMm;
  const targetZ = light.parameters.targetZMm;
  useLayoutEffect(() => {
    const current = ref.current;
    if (!current || typeof targetX !== "number" || typeof targetZ !== "number") return;
    const target = current.target;
    target.position.set(targetX / 1000, typeof targetY === "number" ? targetY / 1000 : 0, targetZ / 1000);
    // three.js ignores a target that is not in the scene, so the overview sun misses an off-centre plan.
    const parent = current.parent;
    if (light.parameters.overview === true && parent && target.parent !== parent) parent.add(target);
    target.updateMatrixWorld();
    return () => { if (target.parent) target.removeFromParent(); };
  }, [light, targetX, targetY, targetZ]);
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
