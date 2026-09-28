import type { ModelViewPresetId } from "../../domain/livingRoom";

type ModelViewCameraDockProps = {
  viewPreset: ModelViewPresetId;
  onChoosePreset: (preset: ModelViewPresetId) => void;
  onReset: () => void;
};

/** Small bottom-centre camera control: orbit, walk, reset to the run frame. */
export function ModelViewCameraDock(props: ModelViewCameraDockProps) {
  return (
    <div className="lr-model-camera-dock" role="toolbar" aria-label="Camera" data-testid="model-camera-dock">
      <button
        type="button"
        aria-label="Orbit camera"
        aria-pressed={props.viewPreset === "orbit"}
        className={props.viewPreset === "orbit" ? "is-active" : undefined}
        onClick={() => props.onChoosePreset("orbit")}
      >
        ↻ Orbit
      </button>
      <button
        type="button"
        aria-label="Walk camera"
        aria-pressed={props.viewPreset === "walkthrough"}
        className={props.viewPreset === "walkthrough" ? "is-active" : undefined}
        onClick={() => props.onChoosePreset("walkthrough")}
      >
        → Walk
      </button>
      <button type="button" aria-label="Reset camera" data-testid="model-camera-reset" onClick={props.onReset}>
        ⌂ Reset
      </button>
    </div>
  );
}
