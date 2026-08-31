import type { Point3Mm } from "../../domain/interiorProject";
import { NumberField } from "./NumberField";

type InspectorPositionFieldsProps = {
  position: Point3Mm;
  onMove: (position: Point3Mm) => void;
};

/** Inspector alternative to dragging on plan or in 3D. */
export function InspectorPositionFields({ position, onMove }: InspectorPositionFieldsProps) {
  return (
    <section>
      <h4>Position</h4>
      <NumberField label="X" value={position.x} onChange={(x) => onMove({ ...position, x })} />
      <NumberField label="Y" value={position.y} onChange={(y) => onMove({ ...position, y })} />
      <NumberField label="Z" value={position.z} onChange={(z) => onMove({ ...position, z })} />
    </section>
  );
}
