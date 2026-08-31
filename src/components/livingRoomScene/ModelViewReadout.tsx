import {
  getModelViewPreset,
  modelViewNavHint,
  type ModelViewPresetId,
} from "../../domain/livingRoom";

type ModelViewReadoutProps = {
  viewPreset: ModelViewPresetId;
  honestyBadge: string;
  exposure: number;
  planTraceHint?: boolean;
};

export function ModelViewReadout({ viewPreset, honestyBadge, exposure, planTraceHint }: ModelViewReadoutProps) {
  const activeView = getModelViewPreset(viewPreset);
  return (
    <div className="lr-model-readout">
      <span className="lr-model-mode-readout"><b>{activeView.symbol} {activeView.label}</b> · {activeView.purpose}</span>
      <span>{modelViewNavHint(viewPreset)}</span>
      <span>{honestyBadge} · {exposure.toFixed(2)} EV</span>
      {planTraceHint ? (
        <span data-testid="plan-trace-hint">Plan traces only — raise walls in 2D to extrude them.</span>
      ) : null}
    </div>
  );
}
