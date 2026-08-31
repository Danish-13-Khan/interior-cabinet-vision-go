import { useState } from "react";
import { isWallRaised, type WallEntity } from "../../domain/interiorProject";

type Props = {
  wall: WallEntity | null;
  roomWallIds: string[];
  heightMm: number;
  onRaise: (wallIds: string[], raised: boolean, heightMm?: number) => void;
  onOffset?: (offsetMm: number) => void;
  onOffsetLoop?: (offsetMm: number) => void;
};

export function WallRaiseControls({ wall, roomWallIds, heightMm, onRaise, onOffset, onOffsetLoop }: Props) {
  const [offsetMm, setOffsetMm] = useState(200);
  const targetIds = wall ? [wall.id] : roomWallIds;
  const raised = wall ? isWallRaised(wall) : false;
  if (targetIds.length === 0) return null;
  return (
    <div className="lr-wall-raise">
      <p>
        {wall
          ? (raised ? "This wall is raised in 3D." : "Plan trace only — raise to extrude this wall.")
          : "Raise the room walls when the 2D outline is ready. 3D stays a floor until you do."}
      </p>
      <div className="lr-wall-raise-actions">
        <button
          type="button"
          data-testid="raise-walls"
          disabled={wall ? raised : false}
          onClick={() => onRaise(targetIds, true, heightMm)}
        >
          {wall ? "Raise to 3D" : "Raise room to 3D"}
        </button>
        <button
          type="button"
          data-testid="lower-walls"
          disabled={wall ? !raised : false}
          onClick={() => onRaise(targetIds, false)}
        >
          Lower to plan
        </button>
      </div>
      {wall && onOffset ? (
        <label className="lr-offset-field">
          <span>Parallel offset (mm)</span>
          <input
            type="number"
            min={50}
            max={4000}
            step={50}
            value={offsetMm}
            onChange={(event) => setOffsetMm(Number(event.target.value) || offsetMm)}
          />
          <button type="button" data-testid="offset-wall" onClick={() => onOffset(offsetMm)}>
            Offset wall
          </button>
        </label>
      ) : null}
      {!wall && onOffsetLoop ? (
        <label className="lr-offset-field">
          <span>Inset room loop (mm)</span>
          <input
            type="number"
            min={50}
            max={4000}
            step={50}
            value={offsetMm}
            onChange={(event) => setOffsetMm(Number(event.target.value) || offsetMm)}
          />
          <button type="button" data-testid="offset-loop" onClick={() => onOffsetLoop(offsetMm)}>
            Offset loop
          </button>
        </label>
      ) : null}
    </div>
  );
}
