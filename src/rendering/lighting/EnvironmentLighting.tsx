import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useState } from "react";
import type { EnvironmentLightingQuality } from "../../domain/livingRoom/environmentLightingQuality";
import { lightformerFallbackForRecipe } from "../../domain/livingRoom/lightingEnvironment";
import type { EnvironmentAssetDefinition } from "../../domain/livingRoom/renderAssetContracts";
import { LoadErrorBoundary } from "./LoadErrorBoundary";

type EnvironmentLightingProps = {
  recipeId: string;
  quality: EnvironmentLightingQuality;
  definition: EnvironmentAssetDefinition | null;
  url: string | null;
  enabled: boolean;
};

function LightformerFallback({
  recipeId,
  intensityScale,
  resolution,
}: {
  recipeId: string;
  intensityScale: number;
  resolution: number;
}) {
  const tone = lightformerFallbackForRecipe(recipeId);
  return (
    <Environment resolution={resolution} frames={1}>
      <Lightformer
        form="rect"
        intensity={tone.skyIntensity * intensityScale}
        color={tone.sky}
        position={[0, 5.5, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[7, 7, 1]}
      />
      <Lightformer
        form="rect"
        intensity={tone.fillIntensity * intensityScale}
        color={tone.fill}
        position={[-5, 2.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[3.5, 5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={tone.rimIntensity * intensityScale}
        color={tone.rim}
        position={[4, 2, -3]}
        rotation={[0, -Math.PI / 3, 0]}
        scale={[2.5, 3.5, 1]}
      />
    </Environment>
  );
}

function HdriEnvironment({
  url,
  definition,
  quality,
}: {
  url: string;
  definition: EnvironmentAssetDefinition;
  quality: EnvironmentLightingQuality;
}) {
  return (
    <Environment
      files={url}
      resolution={quality.resolution}
      background={false}
      blur={definition.backgroundBlur}
      environmentIntensity={definition.intensity * quality.intensityScale}
    />
  );
}

/** HDRI when available; recipe-colored Lightformers otherwise. */
export function EnvironmentLighting({
  recipeId,
  quality,
  definition,
  url,
  enabled,
}: EnvironmentLightingProps) {
  const [forceFallback, setForceFallback] = useState(false);
  if (!enabled) return null;

  const fallback = (
    <LightformerFallback
      recipeId={recipeId}
      intensityScale={quality.intensityScale}
      resolution={quality.resolution}
    />
  );

  const canUseHdri = quality.preferHdri && Boolean(url) && Boolean(definition) && !forceFallback;
  if (!canUseHdri) return fallback;

  return (
    <LoadErrorBoundary fallback={fallback} onError={() => setForceFallback(true)}>
      <Suspense fallback={fallback}>
        <HdriEnvironment
          url={url!}
          definition={definition!}
          quality={quality}
        />
      </Suspense>
    </LoadErrorBoundary>
  );
}
