import {
  SLIDING_DEFAULTS,
  SLIDING_LEAF_COUNT_PARAMETER,
  SLIDING_OVERLAP_PARAMETER,
  SLIDING_OVERLAP_RANGE,
  SLIDING_TRACK_ALLOWANCE_PARAMETER,
  SLIDING_TRACK_ALLOWANCE_RANGE,
  SLIDING_TRACK_KIND_PARAMETER,
  hingedParametersPatch,
  normalizeSlidingDoorSpec,
  slidingLeafCount,
  slidingParametersPatch,
  slidingSpecFromParameters,
} from "../../domain/frontSystem";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  onSetParameters: (objectId: string | readonly string[], patch: Record<string, string | number | boolean>) => void;
};

/** Wardrobe doors: hinged or sliding (§3.4), with leaf count, overlap, track kind and allowance. */
export function SlidingDoorFields({ object, onSetParameters }: Props) {
  const sliding = slidingSpecFromParameters(object.parameters) ?? null;
  const spec = sliding ?? normalizeSlidingDoorSpec(undefined);
  const autoCount = slidingLeafCount(object.dimensions.widthMm, {});
  const set = (patch: Record<string, string | number | boolean>) => onSetParameters(object.id, patch);
  return (
    <div className="lr-gola-fields" data-testid="cabinet-sliding-fields">
      <label className="lr-select-field"><span>Doors</span>
        <select data-testid="cabinet-wardrobe-doors" value={sliding ? "sliding" : "hinged"}
          onChange={(event) => set(event.target.value === "sliding" ? slidingParametersPatch() : hingedParametersPatch())}>
          <option value="hinged">Hinged</option>
          <option value="sliding">Sliding</option>
        </select>
      </label>
      {sliding ? (
        <>
          <label className="lr-select-field"><span>Leaves</span>
            <select data-testid="cabinet-sliding-leaves" value={spec.leafCount ?? "auto"}
              onChange={(event) => set({ [SLIDING_LEAF_COUNT_PARAMETER]: event.target.value === "auto" ? "" : Number(event.target.value) })}>
              <option value="auto">Auto ({autoCount})</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <label className="lr-select-field"><span>Track</span>
            <select data-testid="cabinet-sliding-track" value={spec.trackKind}
              onChange={(event) => set({ [SLIDING_TRACK_KIND_PARAMETER]: event.target.value })}>
              <option value="bottom-roll">Bottom-rolling</option>
              <option value="top-hung">Top-hung</option>
            </select>
          </label>
          <NumberField label="Overlap" value={spec.overlapMm} testId="cabinet-sliding-overlap"
            onChange={(value) => set({ [SLIDING_OVERLAP_PARAMETER]: Math.round(
              Math.min(SLIDING_OVERLAP_RANGE.max, Math.max(SLIDING_OVERLAP_RANGE.min, value))) })} />
          <NumberField label="Track allowance" value={spec.trackAllowanceMm} testId="cabinet-sliding-allowance"
            onChange={(value) => set({ [SLIDING_TRACK_ALLOWANCE_PARAMETER]: Math.round(
              Math.min(SLIDING_TRACK_ALLOWANCE_RANGE.max, Math.max(SLIDING_TRACK_ALLOWANCE_RANGE.min, value))) })} />
          <p className="lr-inspector-hint" data-testid="cabinet-sliding-hint">
            Carcass is {spec.trackAllowanceMm} mm shallower; the track sits in front, so the footprint stays the same.
            {SLIDING_DEFAULTS.confirmed ? "" : " Track values are unconfirmed defaults until the factory confirms them."}
          </p>
        </>
      ) : null}
    </div>
  );
}
