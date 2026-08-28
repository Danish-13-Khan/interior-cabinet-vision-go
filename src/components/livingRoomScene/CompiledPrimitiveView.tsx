import { Edges } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { CompiledMaterialView } from "./CompiledMaterialView";
import { getCompiledGeometry } from "./geometryCache";

function degrees(value: number) {
  return value * Math.PI / 180;
}

export function CompiledPrimitiveView({
  primitive,
  material,
  selected,
  renderMode,
  renderQuality,
  onPointerDown,
}: {
  primitive: CompiledPrimitive;
  material: CompiledMaterial;
  selected: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  return (
    <mesh
      geometry={getCompiledGeometry(primitive)}
      dispose={null}
      userData={{ materialId: material.id, primitiveId: primitive.id }}
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
      onPointerDown={onPointerDown}
    >
      <CompiledMaterialView
        material={material}
        primitiveId={primitive.id}
        renderMode={renderMode}
        renderQuality={renderQuality}
      />
      {selected ? <Edges color="#0878bd" threshold={12} lineWidth={1.35} /> : null}
    </mesh>
  );
}
