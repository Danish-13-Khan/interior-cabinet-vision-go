import { NumberField } from "./NumberField";

export type FinishUvValues = {
  uvScaleMm: number;
  uvRotationDeg: number;
  uvOffsetU: number;
  uvOffsetV: number;
};

type Props = {
  values: FinishUvValues;
  onChange: (patch: Partial<FinishUvValues>) => void;
  compact?: boolean;
};

/** Shared UV transform controls for import preview and finish inspectors. */
export function FinishUvFields({ values, onChange, compact }: Props) {
  return (
    <div className={`lr-finish-uv-fields${compact ? " is-compact" : ""}`} data-testid="finish-uv-fields">
      <NumberField
        label="Tile mm"
        value={values.uvScaleMm}
        onChange={(uvScaleMm) => onChange({ uvScaleMm })}
      />
      <NumberField
        label="Rotate °"
        value={values.uvRotationDeg}
        unit="deg"
        onChange={(uvRotationDeg) => onChange({ uvRotationDeg })}
      />
      <NumberField
        label="Offset U %"
        value={Math.round(values.uvOffsetU * 100)}
        unit="%"
        onChange={(percent) => onChange({ uvOffsetU: Math.max(0, Math.min(100, percent)) / 100 })}
      />
      <NumberField
        label="Offset V %"
        value={Math.round(values.uvOffsetV * 100)}
        unit="%"
        onChange={(percent) => onChange({ uvOffsetV: Math.max(0, Math.min(100, percent)) / 100 })}
      />
    </div>
  );
}
