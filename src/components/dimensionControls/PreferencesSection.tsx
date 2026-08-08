import type { CabinetLayer, ProjectPreferences } from "../../domain/cabinetDimensions";

export function PreferencesSection({
  preferences,
  layers,
  onPreferenceChange,
  onLayerChange,
}: {
  preferences: ProjectPreferences;
  layers: CabinetLayer[];
  onPreferenceChange: (patch: Partial<ProjectPreferences>) => void;
  onLayerChange: (layerId: string, patch: Partial<CabinetLayer>) => void;
}) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Preferences</h2>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="snap-size">Snap Grid (mm)</label>
          <select
            id="snap-size"
            value={preferences.snapSizeMm}
            onChange={(event) => onPreferenceChange({ snapSizeMm: Number(event.currentTarget.value) })}
          >
            {[10, 25, 50, 100, 200].map((size) => (
              <option key={size} value={size}>
                {size} mm
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-grid">
        <div className="field-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={preferences.showGrid}
              onChange={(event) => onPreferenceChange({ showGrid: event.currentTarget.checked })}
            />
            Show grid
          </label>
        </div>
        <div className="field-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={preferences.autoSaveToBrowser}
              onChange={(event) => onPreferenceChange({ autoSaveToBrowser: event.currentTarget.checked })}
            />
            Auto save browser snapshots
          </label>
        </div>
      </div>

      <div className="parts-list">
        {layers.map((layer) => (
          <div key={layer.id} className="parts-list-item">
            <strong>{layer.name}</strong>
            <span>{layer.visible ? "Visible" : "Hidden"} · {layer.locked ? "Locked" : "Editable"}</span>
            <span className="button-row">
              <button type="button" onClick={() => onLayerChange(layer.id, { visible: !layer.visible })}>
                {layer.visible ? "Hide" : "Show"}
              </button>
              <button type="button" onClick={() => onLayerChange(layer.id, { locked: !layer.locked })}>
                {layer.locked ? "Unlock" : "Lock"}
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
