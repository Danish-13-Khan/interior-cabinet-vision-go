import type { CabinetConfig } from "../../domain/cabinetDimensions";
import {
  BACK_PANEL_RULES,
  EDGE_BANDING_OPTIONS,
  FINISHES,
  GRAIN_LABELS,
  MATERIAL_PRESETS,
  THICKNESS_PRESETS,
} from "../../domain/materialSystem";

export function MaterialBuildSection({
  buildRules,
  onConfigChange,
}: {
  buildRules: NonNullable<CabinetConfig["buildRules"]>;
  onConfigChange: (config: Partial<CabinetConfig>) => void;
}) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Material & Build</h2>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="material-preset">Material Preset</label>
          <select
            id="material-preset"
            value={buildRules.materialPresetId}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  materialPresetId: event.currentTarget.value as typeof buildRules.materialPresetId,
                },
              })}
          >
            {MATERIAL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="finish-id">Finish</label>
          <select
            id="finish-id"
            value={buildRules.finishId}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  finishId: event.currentTarget.value as typeof buildRules.finishId,
                },
              })}
          >
            {FINISHES.map((finish) => (
              <option key={finish.id} value={finish.id}>
                {finish.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="edge-banding">Edge Banding</label>
          <select
            id="edge-banding"
            value={buildRules.edgeBandingId}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  edgeBandingId: event.currentTarget.value as typeof buildRules.edgeBandingId,
                },
              })}
          >
            {EDGE_BANDING_OPTIONS.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="grain-direction">Grain</label>
          <select
            id="grain-direction"
            value={buildRules.grainDirection}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  grainDirection: event.currentTarget.value as typeof buildRules.grainDirection,
                },
              })}
          >
            {(Object.keys(GRAIN_LABELS) as Array<keyof typeof GRAIN_LABELS>).map((grain) => (
              <option key={grain} value={grain}>
                {GRAIN_LABELS[grain]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="back-rule">Back Panel Rule</label>
          <select
            id="back-rule"
            value={buildRules.backPanelType}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  backPanelType: event.currentTarget.value as typeof buildRules.backPanelType,
                },
              })}
          >
            {(Object.keys(BACK_PANEL_RULES) as Array<keyof typeof BACK_PANEL_RULES>).map((rule) => (
              <option key={rule} value={rule}>
                {rule}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="carcass-thickness">Carcass Thickness</label>
          <select
            id="carcass-thickness"
            value={buildRules.carcassThicknessMm}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  carcassThicknessMm: Number(event.currentTarget.value),
                },
              })}
          >
            {THICKNESS_PRESETS.filter((preset) => preset.usage === "carcass").map((preset) => (
              <option key={preset.label} value={preset.valueMm}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="back-thickness">Back Thickness</label>
          <select
            id="back-thickness"
            value={buildRules.backPanelThicknessMm}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  backPanelThicknessMm: Number(event.currentTarget.value),
                },
              })}
          >
            {THICKNESS_PRESETS.filter((preset) => preset.usage === "back").map((preset) => (
              <option key={preset.label} value={preset.valueMm}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="shelf-thickness">Shelf Thickness</label>
          <select
            id="shelf-thickness"
            value={buildRules.shelfThicknessMm}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  shelfThicknessMm: Number(event.currentTarget.value),
                },
              })}
          >
            {THICKNESS_PRESETS.filter((preset) => preset.usage === "shelf").map((preset) => (
              <option key={preset.label} value={preset.valueMm}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="drawer-thickness">Drawer Box Thickness</label>
          <select
            id="drawer-thickness"
            value={buildRules.drawerBoxThicknessMm}
            onChange={(event) =>
              onConfigChange({
                buildRules: {
                  ...buildRules,
                  drawerBoxThicknessMm: Number(event.currentTarget.value),
                },
              })}
          >
            {THICKNESS_PRESETS.filter((preset) => preset.usage === "drawer").map((preset) => (
              <option key={preset.label} value={preset.valueMm}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
