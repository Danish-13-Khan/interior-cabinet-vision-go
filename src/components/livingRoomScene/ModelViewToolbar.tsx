import type { RenderQuality } from "../../domain/interiorProject";
import type { CameraEntity } from "../../domain/interiorProject";
import {
  LIVING_ROOM_STYLE_PRESETS,
  MODEL_VIEW_PRESETS,
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
};

export function ModelViewToolbar(props: ModelViewToolbarProps) {
  return (
    <div className="lr-model-controls">
      <div className="lr-view-presets" aria-label="3D camera views">
        {MODEL_VIEW_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className={props.viewPreset === preset.id ? "is-active" : ""}
            aria-label={preset.label}
            aria-pressed={props.viewPreset === preset.id}
            title={preset.purpose}
            onClick={() => props.onViewPreset(preset.id)}
          >
            <span aria-hidden="true">{preset.symbol}</span>{preset.label}
          </button>
        ))}
      </div>
      <button type="button" className="lr-model-guide-button" onClick={props.onOpenGuide}>
        ? 3D guide
      </button>
      {props.viewPreset === "dollhouse" ? (
        <ModelViewDollhousePanel
          cameraHeightMm={props.cameraHeightMm}
          fieldOfViewDegrees={props.fieldOfViewDegrees}
          onCameraHeightMm={props.onCameraHeightMm}
          onFieldOfViewDegrees={props.onFieldOfViewDegrees}
        />
      ) : null}
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
