import { Edges } from "@react-three/drei";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { usePbrMaterial } from "../../rendering/loaders/usePbrMaterial";
import { getCompiledGeometry } from "./geometryCache";

function degrees(value: number) {
  return value * Math.PI / 180;
}

function CompiledMaterialView({
  material,
  primitiveId,
  renderMode,
}: {
  material: CompiledMaterial;
  primitiveId: string;
  renderMode: RenderMode;
}) {
  const pbr = usePbrMaterial(material, renderMode, primitiveId);
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

export function CompiledPrimitiveView({
  primitive,
  material,
  selected,
  renderMode,
}: {
  primitive: CompiledPrimitive;
  material: CompiledMaterial;
  selected: boolean;
  renderMode: RenderMode;
}) {
  return (
    <mesh
      geometry={getCompiledGeometry(primitive)}
      dispose={null}
      position={[
        primitive.positionMm.x / 1000,
        primitive.positionMm.y / 1000,
        primitive.positionMm.z / 1000,
      ]}
      rotation={[
        degrees(primitive.rotationDegrees.x),
        degrees(primitive.rotationDegrees.y),
        degrees(primitive.rotationDegrees.z),
      ]}
      castShadow={primitive.castShadow}
      receiveShadow={primitive.receiveShadow}
    >
      <CompiledMaterialView
        material={material}
        primitiveId={primitive.id}
        renderMode={renderMode}
      />
      {selected ? <Edges color="#0878bd" threshold={12} lineWidth={1.35} /> : null}
    </mesh>
  );
}
