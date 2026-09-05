import {
  wallLengthMm,
  wallPlanAngleDeg,
  wallPlanMidpoint,
  type WallEntity,
  type WallPlanPatch,
} from "../../domain/interiorProject";
import {
  formatPlanDimension,
  wallLengthAnchorLabel,
  DEFAULT_WALL_LENGTH_ANCHOR,
  type PlanDisplayUnit,
} from "../../domain/livingRoom";
import { NumberField } from "./NumberField";

type Props = {
  wall: WallEntity;
  unit: PlanDisplayUnit;
  onChange: (patch: WallPlanPatch) => void;
};

export function WallGeometryFields({ wall, unit, onChange }: Props) {
  const mid = wallPlanMidpoint(wall);
  const anchor = DEFAULT_WALL_LENGTH_ANCHOR;
  return (
    <div className="lr-wall-geometry">
      <NumberField
        label="Length"
        value={wallLengthMm(wall)}
        onChange={(lengthMm) => onChange({ lengthMm, lengthAnchor: anchor })}
      />
      <p className="lr-authoring-hint" data-testid="wall-length-anchor-hint">
        {formatPlanDimension(wallLengthMm(wall), unit)} · {wallLengthAnchorLabel(anchor)}
      </p>
      <NumberField
        label="Angle"
        value={wallPlanAngleDeg(wall)}
        unit="°"
        onChange={(angleDeg) => onChange({ angleDeg })}
      />
      <NumberField label="Position X" value={mid.x} onChange={(xMm) => onChange({ xMm })} />
      <NumberField label="Position Z" value={mid.z} onChange={(zMm) => onChange({ zMm })} />
    </div>
  );
}
