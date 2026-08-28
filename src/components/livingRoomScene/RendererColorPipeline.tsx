import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
} from "three";

export function RendererColorPipeline({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;
    if (gl.shadowMap.type !== PCFShadowMap) gl.shadowMap.type = PCFShadowMap;
  }, [exposure, gl]);
  return null;
}
