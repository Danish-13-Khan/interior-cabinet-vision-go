import { Edges } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useState } from "react";
import type { BufferGeometry } from "three";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { CompiledMaterialView } from "./CompiledMaterialView";
import { acquireCompiledGeometry } from "./geometryCache";

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
  edgesOnly = false,
}: {
  primitive: CompiledPrimitive;
  material: CompiledMaterial;
  selected: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  edgesOnly?: boolean;
}) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  useLayoutEffect(() => {
    const lease = acquireCompiledGeometry(primitive);
    setGeometry(lease.geometry);
    return lease.release;
    // Geometry keys encode every dimension; material/position changes reuse the mesh.
  }, [primitive.geometryKey]);
  if (!geometry) return null;
  return (
    <mesh
      geometry={geometry}
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
      {edgesOnly ? <meshBasicMaterial transparent opacity={0} depthWrite={false} /> : (
        <CompiledMaterialView
          material={material}
          primitiveId={primitive.id}
          renderMode={renderMode}
          renderQuality={renderQuality}
        />
      )}
      {selected ? <Edges color={edgesOnly ? "#c47b12" : "#0878bd"} threshold={12} lineWidth={1.35} /> : null}
    </mesh>
  );
}
