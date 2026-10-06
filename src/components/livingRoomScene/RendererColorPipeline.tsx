import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";
import type { LivingRoomColorManagement } from "../../domain/livingRoom/stylePresets";

const TONE_MAPPING = {
  "aces-filmic": ACESFilmicToneMapping,
  agx: AgXToneMapping,
} as const;

export function RendererColorPipeline({
  exposure,
  toneMapping = "aces-filmic",
}: {
  exposure: number;
  toneMapping?: LivingRoomColorManagement["toneMapping"];
}) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = TONE_MAPPING[toneMapping];
    gl.toneMappingExposure = exposure;
    if (gl.shadowMap.type !== PCFShadowMap) gl.shadowMap.type = PCFShadowMap;
  }, [exposure, gl, toneMapping]);
  return null;
}
