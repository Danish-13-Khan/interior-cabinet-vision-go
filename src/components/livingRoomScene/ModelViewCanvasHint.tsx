import { useState } from "react";
import { getModelViewPreset, modelViewNavHint, type ModelViewPresetId } from "../../domain/livingRoom";

export function ModelViewCanvasHint(props: {
  viewPreset: ModelViewPresetId;
  honestyBadge: string;
  planTraceHint: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const view = getModelViewPreset(props.viewPreset);
  return (
    <p className="model-view-canvas-hint" data-testid="model-view-canvas-hint">
      <span>{view.label} · {modelViewNavHint(props.viewPreset)} · {props.honestyBadge}</span>
      {props.planTraceHint ? <span>Plan traces only — raise walls in 2D to extrude them.</span> : null}
      <button type="button" onClick={() => setOpen(false)}>Dismiss</button>
    </p>
  );
}
