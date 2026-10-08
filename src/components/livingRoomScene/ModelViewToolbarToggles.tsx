import type { ModelViewPresetId } from "../../domain/livingRoom";

/** View-only toggles: ghost the near wall, keep the ceiling slab. Neither touches the document. */
export function ModelViewToolbarToggles(props: {
  viewPreset: ModelViewPresetId;
  cutawayWalls: boolean;
  showCeiling: boolean;
  onCutawayWalls: (value: boolean) => void;
  onShowCeiling: (value: boolean) => void;
}) {
  const walkthrough = props.viewPreset === "walkthrough";
  const ceilingOn = props.showCeiling || walkthrough;
  return (
    <>
      <button
        type="button"
        className={props.cutawayWalls ? "is-active" : ""}
        data-testid="model-cutaway-walls"
        title="Ghost the wall nearest the camera so you can see in — viewing only, walls are not changed"
        aria-pressed={props.cutawayWalls}
        onClick={() => props.onCutawayWalls(!props.cutawayWalls)}
      >
        Cutaway
      </button>
      <button
        type="button"
        className={ceilingOn ? "is-active" : ""}
        data-testid="model-show-ceiling"
        title={walkthrough
          ? "Walkthrough always shows the ceiling"
          : "Show the ceiling slab in this view — clicks pass through it to the room; viewing only"}
        aria-pressed={ceilingOn}
        disabled={walkthrough}
        onClick={() => props.onShowCeiling(!props.showCeiling)}
      >
        Ceiling
      </button>
    </>
  );
}
