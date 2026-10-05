import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom";
import { centreUnderlayOnOrigin, rotateUnderlayBy } from "../../domain/livingRoom/planUnderlayTransform";

type Props = {
  underlay: LivingRoomPlanUnderlay;
  onChange: (underlay: LivingRoomPlanUnderlay) => void;
  moveActive?: boolean;
  onToggleMove?: () => void;
};

/** Quarter turns, centre, move-drag toggle and reset. Every action is one undo step. */
export function PlanUnderlayTransformActions({ underlay, onChange, moveActive, onToggleMove }: Props) {
  const locked = Boolean(underlay.locked);
  return (
    <div className="lr-underlay-transform-actions" data-testid="lr-underlay-transform-actions">
      <button type="button" className="is-secondary" data-testid="lr-underlay-rotate-left" disabled={locked}
        title="Rotate underlay 90° anticlockwise" onClick={() => onChange(rotateUnderlayBy(underlay, -90))}>
        Rotate −90°
      </button>
      <button type="button" className="is-secondary" data-testid="lr-underlay-rotate-right" disabled={locked}
        title="Rotate underlay 90° clockwise" onClick={() => onChange(rotateUnderlayBy(underlay, 90))}>
        Rotate +90°
      </button>
      {onToggleMove ? (
        <button type="button" className={`is-secondary${moveActive ? " is-active" : ""}`}
          data-testid="lr-underlay-move-toggle" aria-pressed={Boolean(moveActive)}
          disabled={!moveActive && (locked || Boolean(underlay.hidden))} onClick={onToggleMove}>
          {moveActive ? "Done moving" : "Move underlay"}
        </button>
      ) : null}
      <button type="button" className="is-secondary" data-testid="lr-underlay-centre" disabled={locked}
        title="Pan to 0 / 0; keeps rotation and scale" onClick={() => onChange(centreUnderlayOnOrigin(underlay))}>
        Centre on origin
      </button>
      <button
        type="button"
        className="is-secondary"
        disabled={locked}
        onClick={() => onChange({
          ...underlay,
          xMm: 0,
          zMm: 0,
          rotationDeg: 0,
          ...(underlay.importWidthMm && underlay.importHeightMm
            ? { widthMm: underlay.importWidthMm, heightMm: underlay.importHeightMm, calibrated: false }
            : {}),
        })}
      >
        Reset transform
      </button>
    </div>
  );
}
