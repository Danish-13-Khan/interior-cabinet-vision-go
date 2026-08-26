import type { PlanDisplayUnit, PlanReadabilitySettings } from "../../domain/livingRoom";

export function PlanReadabilityToolbar({ settings, onChange }: {
  settings: PlanReadabilitySettings;
  onChange: (patch: Partial<PlanReadabilitySettings>) => void;
}) {
  return <div className="lr-toolbar-group lr-readability-toolbar" aria-label="Plan readability">
    <span>Measure</span>
    <select aria-label="Display units" value={settings.unit} onChange={(event) => onChange({ unit: event.target.value as PlanDisplayUnit })}>
      <option value="mm">mm</option><option value="cm">cm</option>
      <option value="m">m</option><option value="ft-in">ft-in</option>
    </select>
    <label title="Show every wall length">
      <input type="checkbox" aria-label="Show all wall lengths" checked={settings.alwaysShowWallLengths} onChange={(event) => onChange({ alwaysShowWallLengths: event.target.checked })} /> Walls
    </label>
    <button type="button" className={settings.visualStyle === "fill" ? "is-active" : ""} onClick={() => onChange({ visualStyle: "fill" })}>Fill</button>
    <button type="button" className={settings.visualStyle === "line" ? "is-active" : ""} onClick={() => onChange({ visualStyle: "line" })}>Line</button>
  </div>;
}
