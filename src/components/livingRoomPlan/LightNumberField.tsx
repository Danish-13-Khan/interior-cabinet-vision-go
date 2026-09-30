export function LightNumberField(props: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="lr-render-field">
      <span>{props.label}</span>
      <input type="number" min={props.min} max={props.max} step={props.step ?? 1} disabled={props.disabled}
        value={Number.isFinite(props.value) ? props.value : 0}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (Number.isFinite(next)) props.onChange(next);
        }} />
    </label>
  );
}
