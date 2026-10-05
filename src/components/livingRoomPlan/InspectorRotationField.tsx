import { useEffect, useRef, useState } from "react";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import {
  CABINET_ROTATION_HINT,
  formatRotationDeg,
  rotatesInQuarterTurns,
  rotationStepFor,
} from "../../domain/livingRoom/objectRotation";
import { parseMmDraft } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  onSetRotation: (objectId: string, rotationY: number) => void;
};

/** Typed rotation plus ±90° steps; shows stored 15° and wall-normal angles as-is. */
export function InspectorRotationField({ object, onSetRotation }: Props) {
  const quarterTurns = rotatesInQuarterTurns(object);
  const value = object.rotation.y;
  const shown = formatRotationDeg(value);
  const [draft, setDraft] = useState(shown);
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setDraft(shown);
  }, [shown]);

  function commit() {
    const next = parseMmDraft(draft);
    if (next === null || formatRotationDeg(next) === shown) {
      setDraft(shown);
      return;
    }
    onSetRotation(object.id, next);
  }

  return (
    <div className="lr-rotation-field" data-testid="inspector-rotation" data-quarter-turns={quarterTurns ? "true" : "false"}>
      <label className="lr-number-field">
        <span>Rotation</span>
        <input
          type="number"
          aria-label="Rotation degrees"
          data-testid="inspector-rotation-input"
          step={rotationStepFor(object)}
          value={draft}
          onFocus={() => { focusedRef.current = true; }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => { focusedRef.current = false; commit(); }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setDraft(shown);
              event.currentTarget.blur();
            }
          }}
        />
        <small>°</small>
      </label>
      <div className="lr-rotation-steps">
        <button type="button" data-testid="inspector-rotate-left" title="Rotate left 90°"
          onClick={() => onSetRotation(object.id, value - 90)}>−90°</button>
        <button type="button" data-testid="inspector-rotate-right" title="Rotate right 90°"
          onClick={() => onSetRotation(object.id, value + 90)}>+90°</button>
      </div>
      {quarterTurns ? (
        <p className="lr-inspector-hint" data-testid="inspector-rotation-hint">{CABINET_ROTATION_HINT}</p>
      ) : null}
    </div>
  );
}
