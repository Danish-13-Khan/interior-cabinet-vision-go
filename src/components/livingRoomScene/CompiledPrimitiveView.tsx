import { Edges } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useState } from "react";
import { Mesh, type BufferGeometry } from "three";
import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { EXCLUDE_FROM_EXPORT } from "../../rendering/sceneExport/sceneExportFilter";
import { CompiledMaterialView } from "./CompiledMaterialView";
import { acquireCompiledGeometry } from "./geometryCache";

function degrees(value: number) {
  return value * Math.PI / 180;
}

/** Calm-neutral shell for a cut-away wall: present, see-through, never in the way. */
const GHOST_FILL = "#dcd6ce";
const GHOST_EDGE = "#b7bec6";
const GHOST_OPACITY = 0.12;
const passThroughRaycast = () => null;

export function CompiledPrimitiveView({
  primitive,
  material,
  selected,
  ghosted = false,
  pickThrough = false,
  renderMode,
  renderQuality,
  onPointerDown,
}: {
  primitive: CompiledPrimitive;
  material: CompiledMaterial;
  selected: boolean;
  /** Draw as a translucent cutaway shell that rays and shadows ignore. */
  ghosted?: boolean;
  /** Keep the normal look but let rays through (ceiling slab seen from above). */
  pickThrough?: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  useLayoutEffect(() => {
    const lease = acquireCompiledGeometry(primitive);
    setGeometry(lease.geometry);
    return lease.release;
    // Geometry keys encode every dimension; material/position changes reuse the mesh.
  }, [primitive.geometryKey]);
  if (!geometry) return null;
  if (ghosted) {
    return (
      <mesh
        geometry={geometry}
        dispose={null}
        raycast={passThroughRaycast}
        userData={{ materialId: material.id, primitiveId: primitive.id, [EXCLUDE_FROM_EXPORT]: true }}
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
        castShadow={false}
        receiveShadow={false}
        renderOrder={1}
      >
        <meshStandardMaterial
          color={GHOST_FILL}
          transparent
          opacity={GHOST_OPACITY}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
        <Edges color={GHOST_EDGE} threshold={12} lineWidth={1}
          userData={{ [EXCLUDE_FROM_EXPORT]: true }} />
      </mesh>
    );
  }
  return (
    <mesh
      geometry={geometry}
      dispose={null}
      raycast={pickThrough ? passThroughRaycast : Mesh.prototype.raycast}
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
      {selected ? <Edges color="#0878bd" threshold={12} lineWidth={1.35}
        userData={{ [EXCLUDE_FROM_EXPORT]: true }} /> : null}
    </mesh>
  );
}
