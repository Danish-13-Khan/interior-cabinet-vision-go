import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import type { ThreeEvent } from "@react-three/fiber";
import { CompiledPrimitiveView } from "./CompiledPrimitiveView";

type ProceduralFallbackObjectProps = {
  primitives: CompiledPrimitive[];
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  ghosted?: boolean;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
};

/** Existing compiled primitives path used when GLB is missing or fails. */
export function ProceduralFallbackObject({
  primitives,
  materials,
  selected,
  ghosted = false,
  renderMode,
  renderQuality,
  onPointerDown,
}: ProceduralFallbackObjectProps) {
  return (
    <>
      {primitives.map((primitive) => (
        <CompiledPrimitiveView
          key={primitive.id}
          primitive={primitive}
          material={materials.get(primitive.materialId) ?? materials.get("compiled:fallback")!}
          selected={selected}
          ghosted={ghosted}
          renderMode={renderMode}
          renderQuality={renderQuality}
          onPointerDown={onPointerDown}
        />
      ))}
    </>
  );
}
