import {
  ceilingCutoutSizeMm, compiledCeilingCutouts, readCeilingCutouts, type InteriorProject, type InteriorRoomEntity,
} from "../../domain/interiorProject";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";
import { lightsInCutout } from "../../domain/livingRoom/lightCutoutMount";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";

/**
 * Room inspector: every cutout in the active room's ceiling with Delete, a
 * COB or panel to drop in flush, and Fit once a fixture sits in it. Drawing
 * starts from the Ceiling cutout tool.
 */
export function CeilingCutoutsSection(props: {
  project: InteriorProject;
  room: InteriorRoomEntity;
  unit: PlanDisplayUnit;
  onDelete: (roomId: string, cutoutId: string) => void;
  lightActions?: LightFixtureActions;
}) {
  const { project, room, lightActions } = props;
  const cutouts = readCeilingCutouts(room);
  const inCeiling = new Set(compiledCeilingCutouts(project, room).map((cutout) => cutout.id));
  // One commit: a second commit in the same tick would start from the stale document and drop the light.
  const addPanel = (cutoutId: string) => lightActions?.addLight("panel", { kind: "cutout", cutoutId }, { fitCutout: true });
  return (
    <div className="lr-wall-panel-actions" data-testid="ceiling-cutouts">
      <h4>Ceiling cutouts</h4>
      {cutouts.length === 0 ? (
        <p className="lr-authoring-hint">Room &amp; plan settings → Ceiling cutout, then drag a rectangle inside the room.</p>
      ) : (
        <ul className="lr-ceiling-cutout-list">
          {cutouts.map((cutout) => {
            const size = ceilingCutoutSizeMm(cutout);
            const hosted = lightsInCutout(project, cutout.id);
            return (
              <li key={cutout.id} data-ceiling-cutout-row={cutout.id}>
                <span>{cutout.label ?? cutout.id}{hosted.length ? ` · ${hosted.map((light) => light.name).join(", ")}` : ""}{inCeiling.has(cutout.id) ? "" : " · not in ceiling"}</span>
                <small>{formatPlanDimension(size.widthMm, props.unit)} × {formatPlanDimension(size.depthMm, props.unit)}</small>
                {lightActions && hosted.length === 0 ? (
                  <>
                    <button type="button" aria-label={`Add COB downlight in ${cutout.id}`}
                      onClick={() => lightActions.addLight("cob", { kind: "cutout", cutoutId: cutout.id })}>COB</button>
                    <button type="button" aria-label={`Add panel light in ${cutout.id}`}
                      onClick={() => addPanel(cutout.id)}>Panel</button>
                  </>
                ) : null}
                {lightActions && hosted[0] ? (
                  <button type="button" aria-label={`Fit ${cutout.id} to ${hosted[0].name}`}
                    onClick={() => lightActions.fitCutoutToLight(cutout.id, hosted[0]!.id)}>Fit</button>
                ) : null}
                <button type="button" aria-label={`Delete cutout ${cutout.id}`}
                  onClick={() => props.onDelete(room.id, cutout.id)}>Delete</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
