import type { LivingRoomAlignMode, PlanReadabilitySettings } from "../../domain/livingRoom";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";

export function PlanStageToolbar(props: {
  canUndo: boolean; canRedo: boolean; hasSelection: boolean; selectedCount: number;
  showGrid: boolean; snapSizeMm: number; readability: PlanReadabilitySettings;
  onUndo: () => void; onRedo: () => void; onDuplicate: () => void; onDelete: () => void;
  onRotate: (delta: number) => void; onAlign: (mode: LivingRoomAlignMode) => void;
  onCreateRun: () => void; onShowGrid: (value: boolean) => void; onSnapSize: (value: number) => void;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return <header className="lr-plan-toolbar">
    <div className="lr-toolbar-group"><span>Edit</span>
      <button type="button" aria-label="Undo" onClick={props.onUndo} disabled={!props.canUndo}>↶</button>
      <button type="button" aria-label="Redo" onClick={props.onRedo} disabled={!props.canRedo}>↷</button>
      <button type="button" aria-label="Duplicate" onClick={props.onDuplicate} disabled={!props.hasSelection}>⧉</button>
      <button type="button" aria-label="Delete" onClick={props.onDelete} disabled={!props.hasSelection}>⌫</button>
    </div>
    <div className="lr-toolbar-group"><span>Transform</span>
      <button type="button" title="Rotate left 90°" onClick={() => props.onRotate(-90)} disabled={!props.hasSelection}>−90°</button>
      <button type="button" title="Rotate right 90°" onClick={() => props.onRotate(90)} disabled={!props.hasSelection}>+90°</button>
    </div>
    <div className="lr-toolbar-group"><span>Align</span>
      <button type="button" title="Align left" onClick={() => props.onAlign("left")} disabled={props.selectedCount < 2}>L</button>
      <button type="button" title="Align centers" onClick={() => props.onAlign("center-x")} disabled={props.selectedCount < 2}>C</button>
      <button type="button" title="Align middles" onClick={() => props.onAlign("center-z")} disabled={props.selectedCount < 2}>M</button>
      <button type="button" title="Distribute" onClick={() => props.onAlign("distribute-x")} disabled={props.selectedCount < 3}>↔</button>
      <button type="button" title="Create cabinet run on selected wall" onClick={props.onCreateRun} disabled={props.selectedCount < 2}>Run</button>
    </div>
    <div className="lr-toolbar-group lr-toolbar-view"><span>Drawing</span>
      <label><input type="checkbox" checked={props.showGrid} onChange={(event) => props.onShowGrid(event.target.checked)} /> Grid</label>
      <select aria-label="Snap size" value={props.snapSizeMm} onChange={(event) => props.onSnapSize(Number(event.target.value))}>
        <option value="25">25 mm</option><option value="50">50 mm</option><option value="100">100 mm</option>
      </select>
    </div>
    <PlanReadabilityToolbar settings={props.readability} onChange={props.onReadability} />
  </header>;
}
