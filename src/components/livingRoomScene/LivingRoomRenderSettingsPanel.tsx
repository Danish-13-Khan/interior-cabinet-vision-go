import type { RenderSettings } from "../../domain/interiorProject";
import {
  applyRenderPresetToSettings,
  getRenderPresetBehavior,
  LIVING_ROOM_LIGHTING_RECIPES,
  matchRenderOutputPreset,
  RENDER_OUTPUT_PRESETS,
  RENDER_QUALITY_PRESETS,
  type LivingRoomLightingRecipeId,
  type PresetHonestyDescription,
} from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { RenderTierHonestyLegend } from "./RenderTierHonestyLegend";

type LivingRoomRenderSettingsPanelProps = {
  settings: RenderSettings;
  exposureDraft: number;
  styleExposure: number;
  honesty: PresetHonestyDescription;
  studioRenderMode: RenderMode;
  cameraName: string | undefined;
  onExposureDraft: (value: number) => void;
  onSettingsChange: (patch: Partial<RenderSettings>) => void;
  onLightingChange: (recipeId: LivingRoomLightingRecipeId) => void;
};

export function LivingRoomRenderSettingsPanel({
  settings,
  exposureDraft,
  styleExposure,
  honesty,
  studioRenderMode,
  cameraName,
  onExposureDraft,
  onSettingsChange,
  onLightingChange,
}: LivingRoomRenderSettingsPanelProps) {
  const outputPreset = matchRenderOutputPreset(settings);
  const qualityBehavior = getRenderPresetBehavior(settings.quality);

  return (
    <aside className="lr-render-settings" aria-label="Render settings">
      <section>
        <h3>Quality</h3>
        <button
          type="button"
          className="lr-render-recommended"
          onClick={() => onSettingsChange({
            ...applyRenderPresetToSettings(settings, "client-preview"),
            exposure: styleExposure,
            composition: "architectural",
            transparentBackground: false,
          })}
        >
          <strong>Use recommended settings</strong>
          <span>Architectural framing · Client Preview package quality</span>
        </button>
        <div className="lr-render-quality-grid">
          {RENDER_QUALITY_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={settings.quality === preset.id ? "is-active" : ""}
              onClick={() => onSettingsChange(applyRenderPresetToSettings(settings, preset.id))}
            >
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
        <p className="lr-render-preset-meta">
          {honesty.headline} · Mode {studioRenderMode.toUpperCase()} · {qualityBehavior.textureDetail} textures ·
          shadows {qualityBehavior.shadowMapSize} · contact {qualityBehavior.contactShadowResolution}
        </p>
        <p className="lr-render-preset-hint">{honesty.subline}</p>
        <RenderTierHonestyLegend />
      </section>
      <section>
        <h3>Output</h3>
        <label className="lr-render-field">
          <span>Composition</span>
          <select
            value={settings.composition}
            onChange={(event) => onSettingsChange({
              composition: event.target.value as RenderSettings["composition"],
            })}
          >
            <option value="architectural">Architectural · recommended</option>
            <option value="project-camera">Project camera · exact</option>
          </select>
        </label>
        <label className="lr-render-field">
          <span>Resolution</span>
          <select
            value={outputPreset?.id ?? "custom"}
            onChange={(event) => {
              const preset = RENDER_OUTPUT_PRESETS.find((item) => item.id === event.target.value)!;
              onSettingsChange({ widthPx: preset.widthPx, heightPx: preset.heightPx });
            }}
          >
            {!outputPreset ? <option value="custom" disabled>Custom · {settings.widthPx}×{settings.heightPx}</option> : null}
            {RENDER_OUTPUT_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name} · {preset.widthPx}×{preset.heightPx}</option>
            ))}
          </select>
        </label>
        <label className="lr-render-check">
          <input
            type="checkbox"
            checked={settings.transparentBackground}
            disabled={!qualityBehavior.allowTransparentBackground}
            onChange={(event) => onSettingsChange({ transparentBackground: event.target.checked })}
          />
          Transparent background
          {!qualityBehavior.allowTransparentBackground ? <small> · not available in Draft</small> : null}
        </label>
      </section>
      <section>
        <h3>Lighting</h3>
        <label className="lr-render-field">
          <span>Light rig</span>
          <select
            value={settings.lightingRecipeId}
            onChange={(event) => onLightingChange(event.target.value as LivingRoomLightingRecipeId)}
          >
            {LIVING_ROOM_LIGHTING_RECIPES.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
            ))}
          </select>
        </label>
        <label className="lr-render-exposure">
          <span>Exposure <b>{exposureDraft.toFixed(2)}</b></span>
          <input
            type="range"
            min="0.5"
            max="1.6"
            step="0.05"
            value={exposureDraft}
            onChange={(event) => onExposureDraft(Number(event.target.value))}
            onPointerUp={() => onSettingsChange({ exposure: exposureDraft })}
            onKeyUp={() => onSettingsChange({ exposure: exposureDraft })}
          />
        </label>
      </section>
      <section className="lr-render-summary">
        <h3>Frame Summary</h3>
        <dl>
          <dt>Camera</dt><dd>{cameraName ?? "None"}</dd>
          <dt>Framing</dt><dd>{settings.composition === "architectural" ? "Architectural" : "Exact"}</dd>
          <dt>Output</dt><dd>{settings.widthPx} × {settings.heightPx}</dd>
          <dt>Pixels</dt><dd>{(settings.widthPx * settings.heightPx / 1_000_000).toFixed(1)} MP</dd>
          <dt>Pipeline</dt><dd>ACES / sRGB</dd>
        </dl>
      </section>
    </aside>
  );
}
