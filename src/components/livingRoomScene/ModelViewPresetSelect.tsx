import {
  MODEL_VIEW_PRESETS,
  type ModelViewPresetId,
} from "../../domain/livingRoom";

export function ModelViewPresetSelect(props: {
  label: string;
  testId: string;
  ids: readonly ModelViewPresetId[];
  viewPreset: ModelViewPresetId;
  onViewPreset: (preset: ModelViewPresetId) => void;
}) {
  const active = props.ids.includes(props.viewPreset);
  return (
    <label className="lr-model-preset-select">
      {props.label}
      <select
        aria-label={props.label}
        data-testid={props.testId}
        value={active ? props.viewPreset : ""}
        onChange={(event) => {
          const next = event.target.value as ModelViewPresetId;
          if (next) props.onViewPreset(next);
        }}
      >
        <option value="" disabled>{props.label}</option>
        {props.ids.map((id) => {
          const preset = MODEL_VIEW_PRESETS.find((item) => item.id === id)!;
          return (
            <option key={preset.id} value={preset.id} data-testid={`model-view-${preset.id}`}>
              {preset.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
