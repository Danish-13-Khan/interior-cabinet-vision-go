import { useMemo, useState } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";

type SurfacePaintPanelProps = {
  project: InteriorProject;
  activeWallId: string | null;
  selectedObject: InteriorObjectEntity | null;
  onFloor: (materialId: string) => void;
  onWall: (wallId: string, materialId: string) => void;
  onObject: (objectId: string, slot: string, materialId: string) => void;
};

type PaintTarget = "floor" | "wall" | "object";

/** A reusable material-picker for every persisted interior surface. */
export function SurfacePaintPanel({ project, activeWallId, selectedObject, onFloor, onWall, onObject }: SurfacePaintPanelProps) {
  const wall = project.walls.find((item) => item.id === activeWallId) ?? project.walls[0] ?? null;
  const [target, setTarget] = useState<PaintTarget>("floor");
  const [slot, setSlot] = useState("");
  const objectSlots = useMemo(() => Object.keys(selectedObject?.materialSlots ?? {}), [selectedObject]);
  const activeSlot = objectSlots.includes(slot) ? slot : objectSlots[0] ?? "";
  const canPaintObject = Boolean(selectedObject && activeSlot);

  function apply(materialId: string) {
    if (target === "floor") onFloor(materialId);
    if (target === "wall" && wall) onWall(wall.id, materialId);
    if (target === "object" && selectedObject && activeSlot) onObject(selectedObject.id, activeSlot, materialId);
  }

  return (
    <section className="lr-surface-painter" aria-label="Surface paint">
      <div className="lr-paint-targets" role="tablist" aria-label="Paint target">
        <button type="button" role="tab" className={target === "floor" ? "is-active" : ""} onClick={() => setTarget("floor")}>Floor</button>
        <button type="button" role="tab" disabled={!wall} className={target === "wall" ? "is-active" : ""} onClick={() => setTarget("wall")}>Wall</button>
        <button type="button" role="tab" disabled={!canPaintObject} className={target === "object" ? "is-active" : ""} onClick={() => setTarget("object")}>Selection</button>
      </div>
      {target === "wall" && wall ? <small>Painting {String(wall.extensions?.wallSide ?? "active wall")}</small> : null}
      {target === "object" ? (
        <label className="lr-select-field"><span>Surface</span><select value={activeSlot} onChange={(event) => setSlot(event.target.value)}>{objectSlots.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      ) : null}
      {target === "object" && !canPaintObject ? <p>Select a cabinet, door, or furniture item to paint its material slots.</p> : null}
      <div className="lr-paint-swatches">
        {project.materials.map((material) => <button key={material.id} type="button" onClick={() => apply(material.id)} title={`Paint with ${material.name}`}>
          <i style={{ background: material.color }} /><span>{material.name}</span><small>{material.kind}</small>
        </button>)}
      </div>
      <p>Click a swatch to paint; the project model and 3D viewport use the same saved material ID.</p>
    </section>
  );
}
