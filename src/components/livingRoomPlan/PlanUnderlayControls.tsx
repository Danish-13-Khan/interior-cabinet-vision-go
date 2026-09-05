import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom";

export function PlanUnderlayControls({ underlay, onChange, onReplace, onCalibrate }: {
  underlay: LivingRoomPlanUnderlay | null;
  onChange: (underlay: LivingRoomPlanUnderlay | null) => void;
  onReplace: () => void;
  onCalibrate?: () => void;
}) {
  if (!underlay) {
    return (
      <div className="lr-underlay-empty" data-testid="lr-underlay-empty">
        <span>⌁</span>
        <strong>Import a floor plan</strong>
        <p>Use PNG, JPG, or WebP as a tracing underlay. Calibrate with a known distance after import.</p>
        <button type="button" data-testid="lr-underlay-choose" onClick={onReplace}>Choose plan image</button>
      </div>
    );
  }

  const locked = Boolean(underlay.locked);
  const hidden = Boolean(underlay.hidden);
  const calibrated = Boolean(underlay.calibrated);
  const update = (patch: Partial<LivingRoomPlanUnderlay>) => {
    if (locked && !("locked" in patch) && !("hidden" in patch)) return;
    onChange({ ...underlay, ...patch });
  };

  return (
    <div className={`lr-underlay-controls ${locked ? "is-locked" : ""} ${hidden ? "is-hidden" : ""}`} data-testid="lr-underlay-controls">
      <div className="lr-underlay-thumb"><img src={underlay.dataUrl} alt="Imported floor plan" /></div>
      <strong>{underlay.fileName}</strong>
      <small>{Math.round(underlay.widthMm)} × {Math.round(underlay.heightMm)} mm</small>
      <div className="lr-underlay-status" data-testid="lr-underlay-status" aria-label="Underlay status">
        <span className={calibrated ? "is-on" : ""} data-testid="lr-underlay-calibrated-chip">
          {calibrated ? "Calibrated" : "Not calibrated"}
        </span>
        {locked ? <span className="is-on" data-testid="lr-underlay-locked-chip">Locked</span> : null}
        {hidden ? <span className="is-on" data-testid="lr-underlay-hidden-chip">Hidden</span> : null}
      </div>
      <label>
        <span>Opacity</span>
        <input
          aria-label="Underlay opacity"
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={underlay.opacity}
          disabled={locked}
          onChange={(event) => update({ opacity: Number(event.target.value) })}
        />
      </label>
      <div className="lr-underlay-transform-grid">
        <label>
          <span>Pan X</span>
          <input
            aria-label="Underlay pan X"
            type="number"
            step="50"
            value={underlay.xMm ?? 0}
            disabled={locked}
            onChange={(event) => update({ xMm: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <span>Pan Y</span>
          <input
            aria-label="Underlay pan Y"
            type="number"
            step="50"
            value={underlay.zMm ?? 0}
            disabled={locked}
            onChange={(event) => update({ zMm: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          <span>Rotate</span>
          <input
            aria-label="Underlay rotation"
            type="number"
            min="-180"
            max="180"
            step="1"
            value={underlay.rotationDeg ?? 0}
            disabled={locked}
            onChange={(event) => update({
              rotationDeg: Math.max(-180, Math.min(180, Number(event.target.value) || 0)),
            })}
          />
        </label>
        <label>
          <span>Width</span>
          <input
            aria-label="Underlay calibrated width"
            type="number"
            min="100"
            step="10"
            value={Math.round(underlay.widthMm)}
            disabled={locked}
            onChange={(event) => {
              const widthMm = Math.max(100, Number(event.target.value) || underlay.widthMm);
              update({
                widthMm,
                heightMm: underlay.heightMm * widthMm / underlay.widthMm,
                calibrated: true,
              });
            }}
          />
        </label>
      </div>
      <div className="lr-underlay-toggles">
        <button
          type="button"
          className="is-secondary"
          data-testid="lr-underlay-lock-toggle"
          onClick={() => onChange({ ...underlay, locked: !locked })}
        >
          {locked ? "Unlock" : "Lock"}
        </button>
        <button
          type="button"
          className="is-secondary"
          data-testid="lr-underlay-hide-toggle"
          onClick={() => onChange({ ...underlay, hidden: !hidden })}
        >
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      <button
        type="button"
        className="is-secondary"
        data-testid="lr-underlay-calibrate"
        disabled={locked}
        onClick={onCalibrate}
      >
        Calibrate with known distance
      </button>
      <button
        type="button"
        className="is-secondary"
        disabled={locked}
        onClick={() => update({
          xMm: 0,
          zMm: 0,
          rotationDeg: 0,
          ...(underlay.importWidthMm && underlay.importHeightMm
            ? { widthMm: underlay.importWidthMm, heightMm: underlay.importHeightMm, calibrated: false }
            : {}),
        })}
      >
        Reset transform
      </button>
      <button type="button" className="is-secondary" disabled={locked} onClick={onReplace}>Replace image</button>
      <button type="button" className="is-danger" disabled={locked} onClick={() => onChange(null)}>Remove underlay</button>
      {locked ? <p className="lr-underlay-lock-hint" data-testid="lr-underlay-lock-hint">Underlay is locked — unlock to edit, calibrate, replace, or remove.</p> : null}
    </div>
  );
}
