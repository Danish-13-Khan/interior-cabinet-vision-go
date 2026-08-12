import type { CompiledMaterial, CompiledPrimitive } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { CompiledPrimitiveView } from "./CompiledPrimitiveView";

type ProceduralFallbackObjectProps = {
  primitives: CompiledPrimitive[];
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  renderMode: RenderMode;
};

/** Existing compiled primitives path used when GLB is missing or fails. */
export function ProceduralFallbackObject({
  primitives,
  materials,
  selected,
  renderMode,
}: ProceduralFallbackObjectProps) {
  return (
    <>
      {primitives.map((primitive) => (
        <CompiledPrimitiveView
          key={primitive.id}
          primitive={primitive}
          material={materials.get(primitive.materialId) ?? materials.get("compiled:fallback")!}
          selected={selected}
          renderMode={renderMode}
        />
      ))}
    </>
  );
}
