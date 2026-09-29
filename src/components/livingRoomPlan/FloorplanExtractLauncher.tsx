import type { FloorplanExtractLauncherState } from "../../hooks/useFloorplanExtractFlow";

export function FloorplanExtractLauncher({ state }: { state: FloorplanExtractLauncherState }) {
  return (
    <section className="lr-room-authoring" data-testid="lr-floorplan-extract-launcher">
      <strong>5. Floor plan → 3D</strong>
      <small>
        {state.available
          ? "Send the underlay to the floor-plan service, review the detected walls, then apply or download a GLB."
          : "Import a PNG, JPG or PDF plan underlay first. DWG underlays are not supported."}
      </small>
      <button type="button" data-testid="lr-floorplan-extract-start"
        disabled={!state.available || state.busy} onClick={state.onStart}>
        {state.busy ? "Detecting walls…" : "Generate 3D from plan"}
      </button>
      {state.error ? <p className="lr-import-error">{state.error}</p> : null}
    </section>
  );
}
