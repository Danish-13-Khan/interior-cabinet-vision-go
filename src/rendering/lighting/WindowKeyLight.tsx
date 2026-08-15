import { useLayoutEffect, useRef } from "react";
import type { DirectionalLight } from "three";
import type { WindowKeyLightDescriptor } from "../../domain/livingRoom/windowKeyLight";
import { shadowMapSizePair } from "./shadowMapSizePair";

type WindowKeyLightProps = {
  lights: readonly WindowKeyLightDescriptor[];
  shadowMapSize: number;
  shadowRadius: number;
};

function WindowKeyDirectional({
  light,
  shadowMapSize,
  shadowRadius,
}: {
  light: WindowKeyLightDescriptor;
  shadowMapSize: number;
  shadowRadius: number;
}) {
  const lightRef = useRef<DirectionalLight>(null);
  useLayoutEffect(() => {
    const current = lightRef.current;
    if (!current) return;
    current.target.position.set(
      light.targetMm.x / 1000,
      light.targetMm.y / 1000,
      light.targetMm.z / 1000,
    );
    current.target.updateMatrixWorld();
  }, [light.targetMm.x, light.targetMm.y, light.targetMm.z]);

  return (
    <directionalLight
      ref={lightRef}
      position={[
        light.positionMm.x / 1000,
        light.positionMm.y / 1000,
        light.positionMm.z / 1000,
      ]}
      color={light.color}
      intensity={light.intensity}
      castShadow={light.castShadow}
      shadow-mapSize={light.castShadow ? shadowMapSizePair(shadowMapSize) : undefined}
      shadow-bias={-0.0003}
      shadow-normalBias={0.035}
      shadow-radius={shadowRadius + 1}
      shadow-camera-near={0.2}
      shadow-camera-far={28}
      shadow-camera-left={-light.shadowPadMeters}
      shadow-camera-right={light.shadowPadMeters}
      shadow-camera-top={light.shadowPadMeters}
      shadow-camera-bottom={-light.shadowPadMeters}
    />
  );
}

/** Thin consumer of domain window-key descriptors — no project mutation. */
export function WindowKeyLight({
  lights,
  shadowMapSize,
  shadowRadius,
}: WindowKeyLightProps) {
  return (
    <>
      {lights.map((light) => (
        <WindowKeyDirectional
          key={light.id}
          light={light}
          shadowMapSize={shadowMapSize}
          shadowRadius={shadowRadius}
        />
      ))}
    </>
  );
}
