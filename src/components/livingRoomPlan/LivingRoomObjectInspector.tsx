import type { InteriorObjectEntity, InteriorProject, Size3Mm } from "../../domain/interiorProject";
import { NumberField } from "./NumberField";

type LivingRoomObjectInspectorProps = {
  object: InteriorObjectEntity;
  materials: InteriorProject["materials"];
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSetMaterial: (objectId: string, slotName: string, materialId: string) => void;
};

/** Shared Plan/Model size and finish editor — millimetres stay InteriorProject truth. */
export function LivingRoomObjectInspector({
  object,
  materials,
  onResize,
  onSetMaterial,
}: LivingRoomObjectInspectorProps) {
  function patchDimension(axis: keyof Size3Mm, value: number) {
    onResize(object.id, { ...object.dimensions, [axis]: value });
  }

  return (
    <section>
      <h3>Selected Object</h3>
      <div className="lr-object-identity">
        <strong>{object.name}</strong>
        <span>{object.catalogItemId}</span>
      </div>
      <h4>Size</h4>
      <NumberField
        label="Width"
        value={object.dimensions.widthMm}
        onChange={(value) => patchDimension("widthMm", value)}
      />
      <NumberField
        label="Depth"
        value={object.dimensions.depthMm}
        onChange={(value) => patchDimension("depthMm", value)}
      />
      <NumberField
        label="Height"
        value={object.dimensions.heightMm}
        onChange={(value) => patchDimension("heightMm", value)}
      />
      <h4>Materials</h4>
      <div className="lr-material-slots">
        {Object.entries(object.materialSlots).map(([slotName, materialId]) => {
          const material = materials.find((item) => item.id === materialId);
          return (
            <label key={slotName}>
              <span><i style={{ background: material?.color ?? "#ccc" }} />{slotName}</span>
              <select
                value={materialId}
                onChange={(event) => onSetMaterial(object.id, slotName, event.target.value)}
              >
                {materials.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </section>
  );
}
