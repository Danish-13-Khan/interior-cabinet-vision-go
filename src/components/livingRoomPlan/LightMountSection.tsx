import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { selectRoomWalls } from "../../domain/interiorProject";
import { readLightMount } from "../../domain/livingRoom/lightAttachments";
import { lightFixtureDefinitionFor, type LightMountKind } from "../../domain/livingRoom/lightFixtureTypes";
import { chooseFixtureHost, mountSelectValue } from "./lightFixtureEdits";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { LightNumberField } from "./LightNumberField";

function offers(light: LightEntity, kind: LightMountKind) {
  return lightFixtureDefinitionFor(light)?.mounts.includes(kind) ?? kind === "free";
}

function wallLabel(wall: { id: string; extensions?: { wallSide?: unknown } }) {
  return typeof wall.extensions?.wallSide === "string" ? `${wall.extensions.wallSide} wall` : wall.id;
}

export function LightMountSection(props: {
  project: InteriorProject;
  light: LightEntity;
  actions: LightFixtureActions;
}) {
  const { project, light, actions } = props;
  const mount = readLightMount(light);
  const roomId = project.activeRoomId;
  const walls = roomId ? selectRoomWalls(project, roomId) : [];
  const cabinets = project.objects.filter((object) => object.roomId === roomId && object.kind === "cabinet");
  const apply = (nextMount: ReturnType<typeof readLightMount>) => actions.setLightMount(light.id, nextMount);
  return (
    <>
      <label className="lr-render-field"><span>Mount</span>
        <select aria-label={`Mount for ${light.name}`} value={mountSelectValue(light)}
          onChange={(event) => {
            const next = chooseFixtureHost(project, light, event.target.value);
            const updated = next.lights.find((item) => item.id === light.id);
            if (updated) apply(readLightMount(updated));
          }}>
          {offers(light, "free") ? <option value="free">Free</option> : null}
          {offers(light, "ceiling") ? <option value="ceiling">Ceiling</option> : null}
          {offers(light, "wall") ? walls.map((wall) => (
            <option key={wall.id} value={`wall:${wall.id}`}>{wallLabel(wall)}</option>
          )) : null}
          {offers(light, "object") ? cabinets.map((object) => (
            <option key={object.id} value={`object:${object.id}`}>{object.name}</option>
          )) : null}
        </select>
      </label>
      {mount.kind === "wall" ? (
        <>
          <LightNumberField label="Along wall (mm)" value={mount.alongMm} step={10} disabled={mount.fitHostWidth}
            onChange={(alongMm) => apply({ ...mount, alongMm })} />
          <LightNumberField label="Centre height (mm)" value={mount.centerHeightMm} min={0} step={10}
            onChange={(centerHeightMm) => apply({ ...mount, centerHeightMm })} />
          <label className="lr-render-field"><span>Wall face</span>
            <select aria-label={`Wall face for ${light.name}`} value={mount.wallSide}
              onChange={(event) => apply({ ...mount, wallSide: event.target.value === "exterior" ? "exterior" : "interior" })}>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </label>
          <label className="lr-render-check">
            <input type="checkbox" checked={mount.fitHostWidth}
              onChange={(event) => apply({ ...mount, fitHostWidth: event.target.checked })} />
            Fit to wall
          </label>
          {mount.fitHostWidth ? (
            <p className="lr-authoring-hint">A fitted strip spans the whole wall, so it cannot slide along it. Untick Fit to wall to shorten and move it.</p>
          ) : null}
        </>
      ) : null}
      {mount.kind === "ceiling" ? (
        <LightNumberField label="Ceiling drop (mm)" value={mount.ceilingDropMm} min={0} step={10}
          onChange={(ceilingDropMm) => apply({ kind: "ceiling", ceilingDropMm })} />
      ) : null}
    </>
  );
}
