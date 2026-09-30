import type { LightEntity } from "../../domain/interiorProject";
import {
  DEFAULT_LIGHT_KELVIN,
  KELVIN_PRESETS,
  MAX_LIGHT_KELVIN,
  MIN_LIGHT_KELVIN,
  readLightKelvin,
} from "../../domain/livingRoom/lightColorTemperature";
import { updateRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import type { LightDocumentPatch } from "./lightFixtureEdits";
import { LightNumberField } from "./LightNumberField";

export function LightToneSection(props: { light: LightEntity; onPatchDocument: LightDocumentPatch }) {
  const { light, onPatchDocument } = props;
  const kelvin = readLightKelvin(light);
  const set = (patch: Parameters<typeof updateRoomLightFixture>[2]) => onPatchDocument(
    (current) => updateRoomLightFixture(current, light.id, patch),
    "Updated room light.",
  );
  return (
    <>
      <label className="lr-render-field"><span>Name</span>
        <input value={light.name} maxLength={100} onChange={(event) => set({ name: event.target.value })} /></label>
      <label className="lr-render-check">
        <input type="checkbox" checked={light.enabled} onChange={(event) => set({ enabled: event.target.checked })} />
        Light on
      </label>
      <LightNumberField label="Brightness" value={light.intensity} min={0} max={100} step={0.5}
        onChange={(intensity) => set({ intensity })} />
      <label className="lr-render-field"><span>Light tone</span>
        <select aria-label={`Light tone for ${light.name}`} value={kelvin === null ? "" : String(kelvin)}
          onChange={(event) => set({ parameters: { colorTemperatureK: Number(event.target.value) } })}>
          <option value="" disabled>Custom colour</option>
          {KELVIN_PRESETS.map((preset) => (
            <option key={preset.kelvin} value={preset.kelvin}>{preset.label} · {preset.kelvin} K</option>
          ))}
        </select>
      </label>
      <LightNumberField label="Colour temperature (K)" value={kelvin ?? DEFAULT_LIGHT_KELVIN}
        min={MIN_LIGHT_KELVIN} max={MAX_LIGHT_KELVIN} step={100}
        onChange={(colorTemperatureK) => set({ parameters: { colorTemperatureK } })} />
      <label className="lr-render-field"><span>Colour</span>
        <input type="color" value={light.color} onChange={(event) => set({ color: event.target.value })} /></label>
      <p className="lr-authoring-hint">Area lights do not cast shadows, so a cove or panel lights through furniture. The cove wash is the ceiling receiving that light, not a bounce.</p>
    </>
  );
}
