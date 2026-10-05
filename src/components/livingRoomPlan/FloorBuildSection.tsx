import { resolveFloorBuild, type FloorBuild, type InteriorRoomEntity } from "../../domain/interiorProject";
import { HeightPresetRow } from "./HeightPresetRow";
import { NumberField } from "./NumberField";

const STRUCTURAL = [12, 60, 150, 220] as const;
const FLOORING = [0, 4, 12, 18] as const;

export function FloorBuildSection(props: {
  room: InteriorRoomEntity;
  onChange: (patch: Partial<FloorBuild>) => void;
}) {
  const build = resolveFloorBuild(props.room);
  return (
    <div data-testid="floor-build">
      <h4>Floor build</h4>
      <NumberField label="Structural thickness" value={build.structuralThicknessMm}
        onChange={(structuralThicknessMm) => props.onChange({ structuralThicknessMm })} />
      <HeightPresetRow label="Structural" values={STRUCTURAL} value={build.structuralThicknessMm}
        onChange={(structuralThicknessMm) => props.onChange({ structuralThicknessMm })} />
      <NumberField label="Flooring thickness" value={build.flooringThicknessMm}
        onChange={(flooringThicknessMm) => props.onChange({ flooringThicknessMm })} />
      <HeightPresetRow label="Flooring" values={FLOORING} value={build.flooringThicknessMm}
        onChange={(flooringThicknessMm) => props.onChange({ flooringThicknessMm })} />
    </div>
  );
}
