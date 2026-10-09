import type { BuildTool } from "../../domain/livingRoom/buildToolCommands";
import { SurfaceDrawingPanel } from "./SurfaceDrawingPanel";

/** Catalog-rail "armed" card for the two polygon tools: Draw Surface and Ceiling cutout. */
export function DrawToolArmedPanel(props: {
  tool: BuildTool;
  pointCount: number;
  materialId: string;
  materials: Array<{ id: string; name: string; color?: string | null }>;
  onMaterialId: (materialId: string) => void;
  onClosePolygon?: () => void;
}) {
  if (props.tool === "draw-surface") {
    return (
      <section className="lr-room-authoring lr-build-commit">
        <strong>Draw Surface · armed</strong>
        <SurfaceDrawingPanel pointCount={props.pointCount} materialId={props.materialId} materials={props.materials}
          onMaterialId={props.onMaterialId} onClosePolygon={props.onClosePolygon} />
      </section>
    );
  }
  if (props.tool === "draw-ceiling-cutout") {
    return (
      <section className="lr-room-authoring lr-build-commit">
        <strong>Ceiling cutout · armed</strong>
        <p>Drag a rectangle inside the room, or click points and close the polygon. Layers → Ceiling shows the slab.</p>
        <button type="button" disabled={props.pointCount < 3} onClick={props.onClosePolygon}>
          Close cutout polygon ({props.pointCount})
        </button>
      </section>
    );
  }
  return null;
}
