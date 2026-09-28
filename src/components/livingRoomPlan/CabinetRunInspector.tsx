import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import {
  cabinetRunForObject,
  cabinetRunLengthMm,
  countCabinetRunFillers,
  proposeCabinetRunComplete,
} from "../../domain/livingRoom";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  onUpdate: (runId: string, options: {
    gapMm?: number;
    alignment?: "start" | "center" | "end";
    extendToWall?: boolean;
    fillersEnabled?: boolean;
  }) => void;
  onCompleteRun?: (runId: string) => void;
  open?: boolean;
};

export function CabinetRunInspector({ object, project, onUpdate, onCompleteRun, open = false }: Props) {
  const run = cabinetRunForObject(object);
  if (!run) return null;
  const fillerCount = countCabinetRunFillers(project, run.runId);
  const lengthMm = cabinetRunLengthMm(project, run.runId);
  const proposal = proposeCabinetRunComplete(project, run.runId);
  return <details className="lr-inspector-section lr-cabinet-run-inspector" data-testid="inspector-run" open={open}>
    <summary>Run <small>{lengthMm} mm</small></summary>
    <div className="lr-inspector-section-body">
    <p className="lr-inspector-hint" data-run-wall-id={run.wallId}>Attached to wall {run.wallId}. Layout follows its real plan segment.</p>
    <p className="lr-inspector-hint" data-testid="cabinet-run-length" data-length-mm={lengthMm}>
      Run length <strong>{lengthMm}</strong> mm
    </p>
    {proposal ? (
      <p className="lr-inspector-hint" data-testid="lr-complete-run-summary">{proposal.summary}</p>
    ) : null}
    <NumberField label="Gap" value={run.gapMm} onChange={(gapMm) => onUpdate(run.runId, { gapMm })} />
    <label className="lr-select-field"><span>Align</span>
      <select value={run.alignment} onChange={(event) => onUpdate(run.runId, { alignment: event.target.value as "start" | "center" | "end" })}>
        <option value="start">Start</option><option value="center">Center</option><option value="end">End</option>
      </select>
    </label>
    <label className="lr-run-extend"><input type="checkbox" checked={run.extendToWall}
      onChange={(event) => onUpdate(run.runId, { extendToWall: event.target.checked })} /> Extend run across wall</label>
    <label className="lr-run-extend"><input type="checkbox" checked={run.fillersEnabled}
      onChange={(event) => onUpdate(run.runId, { fillersEnabled: event.target.checked })} /> Auto fillers (40–150 mm)</label>
    {run.fillersEnabled ? <p className="lr-inspector-hint"><strong>{fillerCount}</strong> filler{fillerCount === 1 ? "" : "s"} on this run.</p> : null}
    {onCompleteRun ? (
      <button type="button" data-testid="lr-complete-run" onClick={() => onCompleteRun(run.runId)}>
        Complete Run
      </button>
    ) : null}
    </div>
  </details>;
}
