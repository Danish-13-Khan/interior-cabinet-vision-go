import type { RenderQuality } from "../../domain/interiorProject";
import type { CameraEntity } from "../../domain/interiorProject";
import {
  LIVING_ROOM_STYLE_PRESETS,
  MODEL_VIEW_EXPLORE_IDS,
  MODEL_VIEW_PRESETS,
  MODEL_VIEW_PRIMARY_CAMERA_IDS,
  modelViewShowsHeightSlider,
  type LivingRoomStyleId,
  type ModelViewPresetId,
  type RenderPresetBehavior,
} from "../../domain/livingRoom";
import type { PresetHonestyDescription } from "../../domain/livingRoom/presetHonesty";
import { ModelViewDollhousePanel } from "./ModelViewDollhousePanel";
import { RenderPresetHonestyBadge } from "./RenderPresetHonestyBadge";

type ModelViewToolbarProps = {
  viewPreset: ModelViewPresetId;
  cameraHeightMm: number;
  fieldOfViewDegrees: number;
  activeCameraId: string | null;
  cameras: readonly CameraEntity[];
  activeStyleId: LivingRoomStyleId;
  cutawayWalls: boolean;
  activeRotation: number;
  hasActiveObject: boolean;
  viewportQuality: RenderQuality;
  modelPresets: readonly RenderPresetBehavior[];
  honesty: PresetHonestyDescription;
  onViewPreset: (preset: ModelViewPresetId) => void;
  onCameraHeightMm: (value: number) => void;
  onFieldOfViewDegrees: (value: number) => void;
  onActiveCameraId: (cameraId: string | null) => void;
  onApplyStyle: (styleId: LivingRoomStyleId) => void;
  onCutawayWalls: (value: boolean) => void;
  onSetRotation: (rotationY: number) => void;
  onViewportQuality: (quality: RenderQuality) => void;
  onOpenGuide: () => void;
  hasSelection: boolean;
  onClearSelection: () => void;
  onFitRoom: () => void;
  onFocusSelection: () => void;
};

function presetButton(
  presetId: ModelViewPresetId,
  active: ModelViewPresetId,
  onViewPreset: (preset: ModelViewPresetId) => void,
) {
  const preset = MODEL_VIEW_PRESETS.find((item) => item.id === presetId)!;
  return (
    <button
      type="button"
      key={preset.id}
      className={active === preset.id ? "is-active" : ""}
      data-testid={`model-view-${preset.id}`}
      aria-label={preset.label}
      aria-pressed={active === preset.id}
      title={preset.purpose}
      onClick={() => onViewPreset(preset.id)}
    >
      <span aria-hidden="true">{preset.symbol}</span>{preset.label}
    </button>
  );
}

export function ModelViewToolbar(props: ModelViewToolbarProps) {
  return (
    <div className="lr-model-controls">
      <div className="lr-view-presets" aria-label="3D camera views" data-testid="model-camera-presets">
        {MODEL_VIEW_PRIMARY_CAMERA_IDS.map((id) => presetButton(id, props.viewPreset, props.onViewPreset))}
      </div>
      <div className="lr-view-presets lr-view-explore" aria-label="3D explore modes">
        {MODEL_VIEW_EXPLORE_IDS.map((id) => presetButton(id, props.viewPreset, props.onViewPreset))}
      </div>
      <div className="lr-view-presets lr-view-fit" aria-label="3D framing">
        <button type="button" data-testid="model-fit-room" title="Fit room (F)" onClick={props.onFitRoom}>
          Fit Room
        </button>
        <button
          type="button"
          data-testid="model-focus-selection"
          title="Focus selection (Shift+F)"
          disabled={!props.hasSelection}
          onClick={props.onFocusSelection}
        >
          Focus Selected
        </button>
      </div>
      <button type="button" className="lr-model-guide-button" onClick={props.onOpenGuide}>
        ? 3D guide
      </button>
      {props.hasSelection ? (
        <button type="button" data-testid="model-clear-selection" onClick={props.onClearSelection}>
          Clear selection
        </button>
      ) : null}
      <ModelViewDollhousePanel
        cameraHeightMm={props.cameraHeightMm}
        fieldOfViewDegrees={props.fieldOfViewDegrees}
        showHeight={modelViewShowsHeightSlider(props.viewPreset)}
        onCameraHeightMm={props.onCameraHeightMm}
        onFieldOfViewDegrees={props.onFieldOfViewDegrees}
      />
      <label>
        Camera
        <select
          value={props.activeCameraId ?? ""}
          onChange={(event) => props.onActiveCameraId(event.target.value || null)}
        >
          {props.cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>{camera.name}</option>
          ))}
        </select>
      </label>
      <label>
        Style
        <select
          aria-label="Interior style"
          value={props.activeStyleId}
          onChange={(event) => props.onApplyStyle(event.target.value as LivingRoomStyleId)}
        >
          {LIVING_ROOM_STYLE_PRESETS.map((style) => (
            <option key={style.id} value={style.id}>{style.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={props.cutawayWalls ? "is-active" : ""}
        onClick={() => props.onCutawayWalls(!props.cutawayWalls)}
      >
        Cutaway
      </button>
      <label>
        Rotate
        <input
          aria-label="Selected object rotation"
          type="range"
          min="0"
          max="345"
          step="15"
          value={props.activeRotation}
          disabled={!props.hasActiveObject}
          onChange={(event) => props.onSetRotation(Number(event.target.value))}
        />
        <b>{props.hasActiveObject ? `${props.activeRotation}°` : "—"}</b>
      </label>
      <button type="button" onClick={() => props.onSetRotation(props.activeRotation - 90)} disabled={!props.hasActiveObject}>
        -90°
      </button>
      <button type="button" onClick={() => props.onSetRotation(props.activeRotation + 90)} disabled={!props.hasActiveObject}>
        +90°
      </button>
      <label>
        Quality
        <select
          aria-label="Viewport quality"
          value={props.viewportQuality}
          onChange={(event) => props.onViewportQuality(event.target.value as RenderQuality)}
        >
          {props.modelPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}{preset.id === "draft" ? " · Fast" : ""}
            </option>
          ))}
        </select>
      </label>
      <RenderPresetHonestyBadge honesty={props.honesty} compact />
    </div>
  );
}
