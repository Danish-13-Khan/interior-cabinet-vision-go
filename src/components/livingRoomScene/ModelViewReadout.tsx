import {
  getModelViewPreset,
  modelViewNavHint,
  type ModelViewPresetId,
} from "../../domain/livingRoom";

type ModelViewReadoutProps = {
  viewPreset: ModelViewPresetId;
  honestyBadge: string;
  exposure: number;
};

export function ModelViewReadout({ viewPreset, honestyBadge, exposure }: ModelViewReadoutProps) {
  const activeView = getModelViewPreset(viewPreset);
  return (
    <div className="lr-model-readout">
      <span className="lr-model-mode-readout"><b>{activeView.symbol} {activeView.label}</b> · {activeView.purpose}</span>
      <span>{modelViewNavHint(viewPreset)}</span>
      <span>{honestyBadge} · {exposure.toFixed(2)} EV</span>
    </div>
  );
}
