import type { InteriorProject, SurfaceZoneEntity } from "../../domain/interiorProject";

export function SurfaceInspector({
  surface,
  materials,
  onUpdate,
  onDelete,
}: {
  surface: SurfaceZoneEntity;
  materials: InteriorProject["materials"];
  onUpdate?: (surfaceId: string, materialId: string) => void;
  onDelete?: (surfaceId: string) => void;
}) {
  return (
    <section className="lr-architecture-inspector" data-testid="interiors-surface-inspector">
      <div className="lr-inspector-section-heading">
        <h3>Surface</h3>
        <span>Zone</span>
      </div>
      <label>
        <span>Material</span>
        <select
          value={surface.materialId ?? ""}
          onChange={(event) => onUpdate?.(surface.id, event.target.value)}
        >
          {materials.map((material) => (
            <option key={material.id} value={material.id}>{material.name}</option>
          ))}
        </select>
      </label>
      {onDelete ? (
        <button type="button" className="is-danger" onClick={() => onDelete(surface.id)}>
          Delete surface zone
        </button>
      ) : null}
    </section>
  );
}
