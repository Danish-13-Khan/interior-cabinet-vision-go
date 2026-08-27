import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom";

export function PlanUnderlayControls({ underlay, onChange, onReplace }: {
  underlay: LivingRoomPlanUnderlay | null;
  onChange: (underlay: LivingRoomPlanUnderlay | null) => void;
  onReplace: () => void;
}) {
  if (!underlay) return <div className="lr-underlay-empty"><span>⌁</span><strong>Import a floor plan</strong>
    <p>Use PNG, JPG, or WebP as a calibrated tracing underlay.</p>
    <button type="button" onClick={onReplace}>Choose plan image</button></div>;
  const update = (patch: Partial<LivingRoomPlanUnderlay>) => onChange({ ...underlay, ...patch });
  return <div className="lr-underlay-controls">
    <div className="lr-underlay-thumb"><img src={underlay.dataUrl} alt="Imported floor plan" /></div>
    <strong>{underlay.fileName}</strong><small>{Math.round(underlay.widthMm)} × {Math.round(underlay.heightMm)} mm</small>
    <label><span>Opacity</span><input aria-label="Underlay opacity" type="range" min="0.05" max="1" step="0.05" value={underlay.opacity} onChange={(event) => update({ opacity: Number(event.target.value) })} /></label>
    <div className="lr-underlay-transform-grid">
      <label><span>Pan X</span><input aria-label="Underlay pan X" type="number" step="50" value={underlay.xMm ?? 0} onChange={(event) => update({ xMm: Number(event.target.value) || 0 })} /></label>
      <label><span>Pan Y</span><input aria-label="Underlay pan Y" type="number" step="50" value={underlay.zMm ?? 0} onChange={(event) => update({ zMm: Number(event.target.value) || 0 })} /></label>
      <label><span>Rotate</span><input aria-label="Underlay rotation" type="number" min="-180" max="180" step="1" value={underlay.rotationDeg ?? 0} onChange={(event) => update({ rotationDeg: Math.max(-180, Math.min(180, Number(event.target.value) || 0)) })} /></label>
      <label><span>Width</span><input aria-label="Underlay calibrated width" type="number" min="100" step="10" value={Math.round(underlay.widthMm)} onChange={(event) => {
        const widthMm = Math.max(100, Number(event.target.value) || underlay.widthMm);
        update({ widthMm, heightMm: underlay.heightMm * widthMm / underlay.widthMm });
      }} /></label>
    </div>
    <button type="button" className="is-secondary" onClick={() => update({ xMm: 0, zMm: 0, rotationDeg: 0 })}>Reset transform</button>
    <button type="button" className="is-secondary" onClick={onReplace}>Replace image</button>
    <button type="button" className="is-danger" onClick={() => onChange(null)}>Remove underlay</button>
  </div>;
}
