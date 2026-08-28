import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { cabinetRunForObject } from "../../domain/livingRoom";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  onUpdate: (runId: string, options: { gapMm?: number; alignment?: "start" | "center" | "end"; extendToWall?: boolean }) => void;
};

export function CabinetRunInspector({ object, onUpdate }: Props) {
  const run = cabinetRunForObject(object);
  if (!run) return null;
  return <section className="lr-cabinet-run-inspector">
    <h4>Cabinet run</h4>
    <p className="lr-inspector-hint">Attached to wall {run.wallId}. Layout follows its real plan segment.</p>
    <NumberField label="Gap" value={run.gapMm} onChange={(gapMm) => onUpdate(run.runId, { gapMm })} />
    <label className="lr-select-field"><span>Align</span>
      <select value={run.alignment} onChange={(event) => onUpdate(run.runId, { alignment: event.target.value as "start" | "center" | "end" })}>
        <option value="start">Start</option><option value="center">Center</option><option value="end">End</option>
      </select>
    </label>
    <label className="lr-run-extend"><input type="checkbox" checked={run.extendToWall}
      onChange={(event) => onUpdate(run.runId, { extendToWall: event.target.checked })} /> Extend run across wall</label>
  </section>;
}
