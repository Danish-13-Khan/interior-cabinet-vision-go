import { createContext, useContext, Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { Group, InstancedMesh, Mesh, type Material, type Object3D } from "three";
import type { RenderQuality } from "../../domain/interiorProject";
import type { CompiledMaterial, CompiledSceneNode } from "../../domain/livingRoom";
import { enableGlbFrustumCulling } from "../../domain/livingRoom/glbFrustumBounds";
import { glbInstanceMatrix, meshMatrixUnderTemplate } from "../../domain/livingRoom/glbInstanceMatrix";
import { glbInstanceKey } from "../../domain/livingRoom/glbInstancePlan";
import { computeGlbScaleFactors } from "../../domain/livingRoom/glbScale";
import type { ModelAssetDefinition, RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { readStoredAssetUrl, readStoredTextureUrls } from "../../platform/storedAssetUrls";
import { applyGlbSlotMaterials } from "../../rendering/materials/applyGlbSlotMaterials";
import { normalizeGlbFloorOrigin } from "../../rendering/loaders/normalizeGlbFloorOrigin";
import { useModelAsset } from "../../rendering/loaders/useModelAsset";
import { useModelViewPreviewQuality } from "../../rendering/ModelViewPreviewProfile";

function cloneMeshMaterials(root: Object3D) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const source = child.material;
    child.material = Array.isArray(source) ? source.map((material) => material.clone()) : source.clone();
  });
}

function InstanceMeshes({
  url, definition, members, materials, renderMode, renderQuality,
}: {
  url: string;
  definition: ModelAssetDefinition;
  members: readonly CompiledSceneNode[];
  materials: Map<string, CompiledMaterial>;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
}) {
  const gltf = useGLTF(readStoredAssetUrl(url));
  const host = useRef<Group>(null);
  const modelViewQuality = useModelViewPreviewQuality();
  const template = useMemo(() => {
    const copy = gltf.scene.clone(true);
    cloneMeshMaterials(copy);
    return copy;
  }, [gltf.scene]);
  // Read members through a ref: the effect re-runs on memberKey, not on a new array with the same nodes.
  const membersRef = useRef(members);
  membersRef.current = members;
  const memberKey = members.map((node) => (
    `${node.id}:${node.positionMm.x}:${node.positionMm.y}:${node.positionMm.z}:${node.rotationDegrees.y}:${node.renderBinding.targetSizeMm?.widthMm ?? 0}`
  )).join(";");

  useLayoutEffect(() => {
    const root = host.current;
    const members = membersRef.current;
    if (!root || members.length === 0) return;
    const binding = members[0]!.renderBinding;
    const measured = normalizeGlbFloorOrigin(template);
    enableGlbFrustumCulling(template);
    applyGlbSlotMaterials(template, {
      materialGroups: definition.materialGroups,
      materialBindings: binding.materialBindings,
      materials,
      renderMode,
      renderQuality,
      modelViewQuality,
      castShadow: false,
      receiveShadow: true,
      importedTextures: readStoredTextureUrls(binding.modelTextureUrls),
      slotPolicies: binding.slotPolicies,
      preserveSourceMaterials: binding.preserveSourceMaterials,
    });
    const created: InstancedMesh[] = [];
    template.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const position = child.geometry.getAttribute("position");
      if (!position || position.count === 0) return;
      const batch = new InstancedMesh(child.geometry, child.material as Material, members.length);
      batch.castShadow = false;
      batch.receiveShadow = true;
      batch.frustumCulled = true;
      batch.raycast = () => {};
      const local = meshMatrixUnderTemplate(template, child);
      members.forEach((node, index) => {
        const target = node.renderBinding.targetSizeMm;
        const scale = target ? computeGlbScaleFactors(target, measured) : { x: 1, y: 1, z: 1 };
        batch.setMatrixAt(index, glbInstanceMatrix(node.positionMm, node.rotationDegrees, scale, local));
      });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      created.push(batch);
      root.add(batch);
    });
    return () => {
      for (const mesh of created) {
        root.remove(mesh);
        // Also frees the instance buffer: WebGLObjects removes instanceMatrix on this dispose event.
        mesh.dispose();
      }
    };
  }, [definition, materials, memberKey, modelViewQuality, renderMode, renderQuality, template]);

  return <group ref={host} />;
}

function GlbInstanceBatch({
  members, materials, renderMode, renderQuality,
}: {
  members: readonly CompiledSceneNode[];
  materials: Map<string, CompiledMaterial>;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
}) {
  const asset = useModelAsset(members[0]!.renderBinding);
  if (!asset.url || !asset.definition) return null;
  return (
    <Suspense fallback={null}>
      <InstanceMeshes
        url={asset.url}
        definition={asset.definition}
        members={members}
        materials={materials}
        renderMode={renderMode}
        renderQuality={renderQuality}
      />
    </Suspense>
  );
}

const GlbInstancingContext = createContext(false);

/** Repeated models share one draw only while this is on (the apartment overview). */
export function GlbInstancingProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <GlbInstancingContext.Provider value={enabled}>{children}</GlbInstancingContext.Provider>;
}

export function useGlbInstancing() {
  return useContext(GlbInstancingContext);
}

/** One draw per mesh for every repeated model that is not selected. */
export function GlbInstanceBatches({
  nodes, materials, renderMode, renderQuality,
}: {
  nodes: readonly CompiledSceneNode[];
  materials: Map<string, CompiledMaterial>;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, CompiledSceneNode[]>();
    for (const node of nodes) {
      const key = glbInstanceKey(node.renderBinding);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(node);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [nodes]);
  return groups.map(([key, members]) => (
    <GlbInstanceBatch
      key={key}
      members={members}
      materials={materials}
      renderMode={renderMode}
      renderQuality={renderQuality}
    />
  ));
}
