type Props = {
  label: string;
  values: readonly number[];
  value: number;
  onChange: (value: number) => void;
  unit?: string;
};

export function HeightPresetRow({ label, values, value, onChange, unit = "mm" }: Props) {
  return (
    <div className="lr-height-presets" role="group" aria-label={`${label} in ${unit}`}>
      <span>{label} <small>{unit}</small></span>
      <div>
        {values.map((item) => (
          <button
            type="button"
            key={item}
            className={value === item ? "is-active" : ""}
            aria-pressed={value === item}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
