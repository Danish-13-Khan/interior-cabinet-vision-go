import { useLayoutEffect, useRef } from "react";
import type { DirectionalLight } from "three";
import type { WindowKeyLightDescriptor } from "../../domain/livingRoom/windowKeyLight";
import type { ShadowCameraTuning } from "../../domain/livingRoom/shadowCameraTuning";
import { STUDIO_WINDOW_KEY_SHADOW } from "../../domain/livingRoom/shadowCameraTuning";
import { shadowMapSizePair } from "./shadowMapSizePair";

type WindowKeyLightProps = {
  lights: readonly WindowKeyLightDescriptor[];
  shadowMapSize: number;
  shadowRadius: number;
  intensityScale?: number;
  /** Policy A override; Studio omits → STUDIO_WINDOW_KEY_SHADOW. */
  shadowCamera?: ShadowCameraTuning;
};

function WindowKeyDirectional({
  light,
  shadowMapSize,
  shadowRadius,
  intensityScale = 1,
  shadowCamera,
}: {
  light: WindowKeyLightDescriptor;
  shadowMapSize: number;
  shadowRadius: number;
  intensityScale?: number;
  shadowCamera: ShadowCameraTuning;
}) {
  const lightRef = useRef<DirectionalLight>(null);
  const pad = shadowCamera.padMeters ?? light.shadowPadMeters;
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
      intensity={light.intensity * intensityScale}
      castShadow={light.castShadow}
      shadow-mapSize={light.castShadow ? shadowMapSizePair(shadowMapSize) : undefined}
      shadow-bias={shadowCamera.bias}
      shadow-normalBias={shadowCamera.normalBias}
      shadow-radius={shadowRadius + shadowCamera.radiusExtra}
      shadow-camera-near={shadowCamera.near}
      shadow-camera-far={shadowCamera.far}
      shadow-camera-left={-pad}
      shadow-camera-right={pad}
      shadow-camera-top={pad}
      shadow-camera-bottom={-pad}
    />
  );
}

/** Thin consumer of domain window-key descriptors — no project mutation. */
export function WindowKeyLight({
  lights,
  shadowMapSize,
  shadowRadius,
  intensityScale = 1,
  shadowCamera,
}: WindowKeyLightProps) {
  const cam = shadowCamera ?? STUDIO_WINDOW_KEY_SHADOW;
  return (
    <>
      {lights.map((light) => (
        <WindowKeyDirectional
          key={light.id}
          light={light}
          shadowMapSize={shadowMapSize}
          shadowRadius={shadowRadius}
          intensityScale={intensityScale}
          shadowCamera={cam}
        />
      ))}
    </>
  );
}
