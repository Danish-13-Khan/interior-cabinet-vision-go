import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useState } from "react";
import { BoxHelper, Group } from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import {
  computeGlbScaleFactors,
  nativeSizeMmToMeters,
} from "../../domain/livingRoom/glbScale";
import { resolveGlbCastShadow } from "../../domain/livingRoom/glbCastShadow";
import type {
  ModelAssetDefinition,
  RenderBinding,
  RenderMode,
} from "../../domain/livingRoom/renderAssetContracts";
import { applyGlbSlotMaterials } from "../../rendering/materials/applyGlbSlotMaterials";
import { normalizeGlbFloorOrigin } from "../../rendering/loaders/normalizeGlbFloorOrigin";
import { useModelViewPreviewQuality } from "../../rendering/ModelViewPreviewProfile";

export type AssetBackedGlbContentProps = {
  url: string;
  definition: ModelAssetDefinition;
  binding: RenderBinding;
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  glbCasterSlot?: number;
  maxGlbCasters?: number;
  onReady?: () => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
};

function WorldBoundsOutline({ target }: { target: Group }) {
  const canvasScene = useThree((state) => state.scene);
  const helper = useMemo(() => new BoxHelper(target, "#0878bd"), [target]);

  useLayoutEffect(() => {
    helper.renderOrder = 10;
    helper.material.depthTest = false;
    return () => {
      helper.geometry.dispose();
      helper.material.dispose();
    };
  }, [helper]);
  useFrame(() => helper.update());

  return createPortal(<primitive object={helper} />, canvasScene);
}

/** Loaded GLB scene content with Model View caster budget applied. */
export function AssetBackedGlbContent({
  url,
  definition,
  binding,
  materials,
  selected,
  renderMode,
  renderQuality,
  glbCasterSlot,
  maxGlbCasters,
  onReady,
  onPointerDown,
}: AssetBackedGlbContentProps) {
  const modelViewQuality = useModelViewPreviewQuality();
  const gltf = useGLTF(url);
  const invalidate = useThree((state) => state.invalidate);
  const castShadow = resolveGlbCastShadow({
    renderMode,
    modelViewPreview: modelViewQuality != null,
    modelViewQuality,
    glbCasterSlot,
    maxGlbCasters,
  });
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const target = binding.targetSizeMm;
  const [scale, setScale] = useState(() =>
    target
      ? computeGlbScaleFactors(target, nativeSizeMmToMeters(definition.nativeSizeMm))
      : { x: 1, y: 1, z: 1 },
  );
  const [modelRoot, setModelRoot] = useState<Group | null>(null);
  const slotKey = JSON.stringify(binding.materialBindings);
  const groupsKey = JSON.stringify(definition.materialGroups);

  useLayoutEffect(() => {
    const size = normalizeGlbFloorOrigin(scene);
    scene.traverse((child) => {
      if (child instanceof Group) return;
      child.frustumCulled = false;
    });
    if (target) setScale(computeGlbScaleFactors(target, size));
  }, [scene, target?.depthMm, target?.heightMm, target?.widthMm]);

  useLayoutEffect(() => {
    if (!modelRoot) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      modelRoot.updateMatrixWorld(true);
      invalidate();
      secondFrame = requestAnimationFrame(() => {
        modelRoot.updateMatrixWorld(true);
        invalidate();
        onReady?.();
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [invalidate, modelRoot, scale.x, scale.y, scale.z]);

  useLayoutEffect(() => {
    applyGlbSlotMaterials(scene, {
      materialGroups: definition.materialGroups,
      materialBindings: binding.materialBindings,
      materials,
      renderMode,
      renderQuality,
      modelViewQuality,
      castShadow,
      receiveShadow: true,
      importedTextures: binding.modelTextureUrls,
      slotPolicies: binding.slotPolicies,
      preserveSourceMaterials: binding.preserveSourceMaterials,
    });
  }, [
    castShadow, groupsKey, materials, modelViewQuality, renderMode, renderQuality,
    scene, slotKey, binding.modelTextureUrls, binding.slotPolicies,
    binding.preserveSourceMaterials,
  ]);

  return (
    <>
      <group ref={setModelRoot} scale={[scale.x, scale.y, scale.z]} onPointerDown={onPointerDown}>
        <primitive object={scene} />
      </group>
      {selected && modelRoot ? <WorldBoundsOutline target={modelRoot} /> : null}
    </>
  );
}
