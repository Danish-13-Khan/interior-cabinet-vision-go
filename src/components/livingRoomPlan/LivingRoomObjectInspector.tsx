import type { InteriorObjectEntity, InteriorProject, Size3Mm } from "../../domain/interiorProject";
import { catalogSlotPoliciesForObject } from "../../domain/catalog";
import { cabinetFinishId, isMillworkObject } from "../../domain/livingRoom";
import { NumberField } from "./NumberField";
import { DimensionPresetMenu } from "./DimensionPresetMenu";
import { CabinetRunInspector } from "./CabinetRunInspector";
import { MaterialSlotList } from "./MaterialSlotList";

type LivingRoomObjectInspectorProps = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  materials: InteriorProject["materials"];
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
  onUpdateRun: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
};

/** Shared Plan/Model size and finish editor — millimetres stay InteriorProject truth. */
export function LivingRoomObjectInspector({
  object, project, materials, onResize, onSetMaterial, onSetParameters, onUpdateRun,
}: LivingRoomObjectInspectorProps) {
  function patchDimension(axis: keyof Size3Mm, value: number) {
    onResize(object.id, { ...object.dimensions, [axis]: value });
  }
  const onSchedule = isMillworkObject(object);

  return (
    <section>
      <h3>Selected Object</h3>
      <div className="lr-object-identity">
        <strong>{object.name}</strong>
        <span>{object.catalogItemId}</span>
        {onSchedule
          ? <em className="lr-millwork-badge">On Millwork Schedule</em>
          : <em className="lr-millwork-badge is-soft">Soft good — not on schedule</em>}
      </div>
      <h4 className="lr-dimensions-heading">Dimensions <small>millimetres</small></h4>
      <div className="lr-dimension-cards" aria-label="Object dimensions in millimetres">
        <NumberField className="lr-dimension-card" label="W" value={object.dimensions.widthMm} onChange={(value) => patchDimension("widthMm", value)} />
        <NumberField className="lr-dimension-card" label="H" value={object.dimensions.heightMm} onChange={(value) => patchDimension("heightMm", value)} />
        <NumberField className="lr-dimension-card" label="D" value={object.dimensions.depthMm} onChange={(value) => patchDimension("depthMm", value)} />
      </div>
      {object.kind === "cabinet" ? <DimensionPresetMenu dimensions={object.dimensions} onChange={(dimensions) => onResize(object.id, dimensions)} /> : null}
      <p className="lr-inspector-hint">Drag to move. Duplicate, Copy, and Delete are in the inspector; plan shortcuts still work.</p>
      <MaterialSlotList slots={object.materialSlots} materials={materials}
        slotPolicies={catalogSlotPoliciesForObject(object)}
        onSet={(slotName, materialId) => onSetMaterial(object.id, slotName, materialId)} />
      {object.kind === "cabinet" && object.category !== "filler" ? (
        <>
          <h4>Cabinet configuration</h4>
          <label className="lr-select-field"><span>Finish</span><select data-testid="cabinet-finish" value={cabinetFinishId(object)} onChange={(event) => onSetParameters(object.id, { finishId: event.target.value })}><option value="wood-oak">Oak Woodgrain</option><option value="wood-walnut">Walnut</option><option value="white-matte">White Matte</option><option value="grey">Grey Matte</option></select></label>
          <label className="lr-select-field"><span>Door style</span><select data-testid="cabinet-door-style" value={String(object.parameters.doorStyle ?? "slab")} onChange={(event) => onSetParameters(object.id, { doorStyle: event.target.value })}><option value="slab">Slab</option><option value="shaker">Shaker</option><option value="glass">Glass</option></select></label>
          <NumberField label="Door count" value={Number(object.parameters.doorCount) || 2} onChange={(doorCount) => onSetParameters(object.id, { doorCount: Math.max(1, Math.round(doorCount)) })} />
          <NumberField label="Drawer count" value={Number(object.parameters.drawerCount) || 0} onChange={(drawerCount) => onSetParameters(object.id, { drawerCount: Math.max(0, Math.round(drawerCount)) })} />
          <NumberField label="Shelf count" value={Number(object.parameters.shelfCount) || 0} onChange={(shelfCount) => onSetParameters(object.id, { shelfCount: Math.max(0, Math.round(shelfCount)) })} />
          <p className="lr-inspector-hint" data-wall-snapped={object.extensions?.wallAttachment ? "true" : "false"}>{object.extensions?.wallAttachment ? "Wall snapped — drag near another wall to reattach." : "Drag near a wall to snap this cabinet."}</p>
        </>
      ) : null}
      {object.kind === "cabinet" && object.category !== "filler"
        ? <CabinetRunInspector object={object} project={project} onUpdate={onUpdateRun} />
        : null}
    </section>
  );
}
