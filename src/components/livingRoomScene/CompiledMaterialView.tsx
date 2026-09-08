import { Suspense } from "react";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { usePbrMaterial } from "../../rendering/loaders/usePbrMaterial";
import {
  hasCuratedTextureUrls,
  resolveMaterialTextureUrls,
} from "../../rendering/materials/resolveMaterialTextureUrls";
import { GlbLoadErrorBoundary } from "./GlbLoadErrorBoundary";
import { CuratedPbrMaterial } from "./CuratedPbrMaterial";

function ProceduralPbrMaterial({
  material,
  primitiveId,
  renderMode,
  renderQuality,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
}) {
  const pbr = usePbrMaterial(material, renderMode, primitiveId, renderQuality);
  return (
    <meshPhysicalMaterial
      color={pbr.color}
      map={pbr.maps.map}
      bumpMap={pbr.maps.bumpMap}
      bumpScale={pbr.bumpScale}
      roughness={pbr.roughness}
      metalness={pbr.metalness}
      opacity={pbr.opacity}
      transparent={pbr.transparent}
      depthWrite={pbr.depthWrite}
      transmission={pbr.transmission}
      thickness={pbr.thickness}
      ior={pbr.ior}
      clearcoat={pbr.clearcoat}
      clearcoatRoughness={pbr.clearcoatRoughness}
      sheen={pbr.sheen}
      sheenColor={pbr.sheenColor}
      sheenRoughness={pbr.sheenRoughness}
      envMapIntensity={pbr.envMapIntensity}
      specularIntensity={pbr.specularIntensity}
    />
  );
}

/** Prefer curated file maps; fall back to procedural canvas maps. */
export function CompiledMaterialView({
  material,
  primitiveId,
  renderMode,
  renderQuality,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
}) {
  const urls = resolveMaterialTextureUrls(material);
  const procedural = (
    <ProceduralPbrMaterial
      material={material}
      primitiveId={primitiveId}
      renderMode={renderMode}
      renderQuality={renderQuality}
    />
  );
  if (!hasCuratedTextureUrls(urls)) {
    return procedural;
  }
  return (
    <GlbLoadErrorBoundary fallback={procedural}>
      <Suspense fallback={procedural}>
        <CuratedPbrMaterial
          material={material}
          primitiveId={primitiveId}
          renderMode={renderMode}
          renderQuality={renderQuality}
          urls={urls}
        />
      </Suspense>
    </GlbLoadErrorBoundary>
  );
}
