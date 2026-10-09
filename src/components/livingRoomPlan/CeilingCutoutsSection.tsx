import { ceilingCutoutSizeMm, readCeilingCutouts, type InteriorRoomEntity } from "../../domain/interiorProject";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";

/** Room inspector: every cutout in the active room's ceiling, with Delete. Drawing starts from the Ceiling cutout tool. */
export function CeilingCutoutsSection(props: {
  room: InteriorRoomEntity;
  unit: PlanDisplayUnit;
  onDelete: (roomId: string, cutoutId: string) => void;
}) {
  const cutouts = readCeilingCutouts(props.room);
  return (
    <div className="lr-wall-panel-actions" data-testid="ceiling-cutouts">
      <h4>Ceiling cutouts</h4>
      {cutouts.length === 0 ? (
        <p className="lr-authoring-hint">Room &amp; plan settings → Ceiling cutout, then drag a rectangle inside the room.</p>
      ) : (
        <ul className="lr-ceiling-cutout-list">
          {cutouts.map((cutout) => {
            const size = ceilingCutoutSizeMm(cutout);
            return (
              <li key={cutout.id} data-ceiling-cutout-row={cutout.id}>
                <span>{cutout.label ?? cutout.id}</span>
                <small>{formatPlanDimension(size.widthMm, props.unit)} × {formatPlanDimension(size.depthMm, props.unit)}</small>
                <button type="button" aria-label={`Delete cutout ${cutout.id}`}
                  onClick={() => props.onDelete(props.room.id, cutout.id)}>Delete</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
