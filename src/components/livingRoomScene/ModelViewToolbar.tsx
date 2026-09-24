import type { CameraEntity, RenderQuality } from "../../domain/interiorProject";
import {
  MODEL_VIEW_EXPLORE_IDS,
  MODEL_VIEW_PRIMARY_CAMERA_IDS,
  modelViewShowsHeightSlider,
  type ModelViewPresetId,
  type RenderPresetBehavior,
} from "../../domain/livingRoom";
import type { PresetHonestyDescription } from "../../domain/livingRoom/presetHonesty";
import { ModelViewAdvancedCameraPopover } from "./ModelViewAdvancedCameraPopover";
import { ModelViewDollhousePanel } from "./ModelViewDollhousePanel";
import { ModelViewPresetSelect } from "./ModelViewPresetSelect";
import { RenderPresetHonestyBadge } from "./RenderPresetHonestyBadge";

type ModelViewToolbarProps = {
  viewPreset: ModelViewPresetId;
  cameraHeightMm: number;
  fieldOfViewDegrees: number;
  activeCameraId: string | null;
  cameras: readonly CameraEntity[];
  activeRotation: number;
  hasActiveObject: boolean;
  viewportQuality: RenderQuality;
  modelPresets: readonly RenderPresetBehavior[];
  honesty: PresetHonestyDescription;
  onViewPreset: (preset: ModelViewPresetId) => void;
  onCameraHeightMm: (value: number) => void;
  onFieldOfViewDegrees: (value: number) => void;
  onActiveCameraId: (cameraId: string | null) => void;
  onSetRotation: (rotationY: number) => void;
  onViewportQuality: (quality: RenderQuality) => void;
  onOpenGuide: () => void;
  hasSelection: boolean;
  onClearSelection: () => void;
  onFitRoom: () => void;
  onFocusSelection: () => void;
  onMeasure?: () => void;
  onMaterials?: () => void;
};

/** One compact 3D row. View modes sit in dropdowns; fronts and style live in the side panel. */
export function ModelViewToolbar(props: ModelViewToolbarProps) {
  return (
    <div className="lr-model-controls" data-testid="model-review-toolbar">
      <ModelViewPresetSelect
        label="Camera"
        testId="model-camera-presets"
        ids={MODEL_VIEW_PRIMARY_CAMERA_IDS}
        viewPreset={props.viewPreset}
        onViewPreset={props.onViewPreset}
      />
      <ModelViewPresetSelect
        label="Explore"
        testId="model-explore-presets"
        ids={MODEL_VIEW_EXPLORE_IDS}
        viewPreset={props.viewPreset}
        onViewPreset={props.onViewPreset}
      />
      {props.onMeasure ? <button type="button" onClick={props.onMeasure}>Measure</button> : null}
      <button type="button" data-testid="model-fit-room" title="Fit room" onClick={props.onFitRoom}>
        Frame all
      </button>
      <button
        type="button"
        data-testid="model-focus-selection"
        title="Focus selection"
        disabled={!props.hasSelection}
        onClick={props.onFocusSelection}
      >
        Frame
      </button>
      {props.onMaterials ? <button type="button" onClick={props.onMaterials}>Materials</button> : null}
      {props.hasSelection ? (
        <button type="button" data-testid="model-clear-selection" onClick={props.onClearSelection}>
          Clear
        </button>
      ) : null}
      <ModelViewAdvancedCameraPopover openLabel="Settings">
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
          Quality
          <select
            aria-label="Viewport quality"
            value={props.viewportQuality}
            onChange={(event) => props.onViewportQuality(event.target.value as RenderQuality)}
          >
            {props.modelPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </label>
        <RenderPresetHonestyBadge honesty={props.honesty} compact />
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
        <div className="lr-model-advanced-actions">
          <button type="button" onClick={() => props.onSetRotation(props.activeRotation - 90)} disabled={!props.hasActiveObject}>−90°</button>
          <button type="button" onClick={() => props.onSetRotation(props.activeRotation + 90)} disabled={!props.hasActiveObject}>+90°</button>
          <button type="button" className="lr-model-guide-button" onClick={props.onOpenGuide}>3D guide</button>
        </div>
      </ModelViewAdvancedCameraPopover>
    </div>
  );
}
