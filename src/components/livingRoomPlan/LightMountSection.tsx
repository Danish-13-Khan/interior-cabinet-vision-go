import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { selectRoomWalls } from "../../domain/interiorProject";
import { readLightMount, updateLightMount } from "../../domain/livingRoom/lightAttachments";
import { lightFixtureDefinitionFor, type LightMountKind } from "../../domain/livingRoom/lightFixtureTypes";
import { chooseFixtureHost, mountSelectValue, patchWallMount, type LightDocumentPatch } from "./lightFixtureEdits";
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
  onPatchDocument: LightDocumentPatch;
}) {
  const { project, light, onPatchDocument } = props;
  const mount = readLightMount(light);
  const roomId = project.activeRoomId;
  const walls = roomId ? selectRoomWalls(project, roomId) : [];
  const cabinets = project.objects.filter((object) => object.roomId === roomId && object.kind === "cabinet");
  const patch = (status: string, update: (current: InteriorProject) => InteriorProject) => onPatchDocument(update, status);
  return (
    <>
      <label className="lr-render-field"><span>Mount</span>
        <select aria-label={`Mount for ${light.name}`} value={mountSelectValue(light)}
          onChange={(event) => patch("Updated light attachment.", (current) => chooseFixtureHost(current, light, event.target.value))}>
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
          <LightNumberField label="Along wall (mm)" value={mount.alongMm} step={10}
            onChange={(alongMm) => patch("Updated light attachment.", (current) => patchWallMount(current, light, { alongMm }))} />
          <LightNumberField label="Centre height (mm)" value={mount.centerHeightMm} min={0} step={10}
            onChange={(centerHeightMm) => patch("Updated light attachment.", (current) => patchWallMount(current, light, { centerHeightMm }))} />
          <label className="lr-render-field"><span>Wall face</span>
            <select aria-label={`Wall face for ${light.name}`} value={mount.wallSide}
              onChange={(event) => patch("Updated light attachment.", (current) => patchWallMount(current, light, {
                wallSide: event.target.value === "exterior" ? "exterior" : "interior",
              }))}>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </label>
          <label className="lr-render-check">
            <input type="checkbox" checked={mount.fitHostWidth}
              onChange={(event) => patch("Updated light attachment.", (current) => patchWallMount(current, light, { fitHostWidth: event.target.checked }))} />
            Fit to wall
          </label>
        </>
      ) : null}
      {mount.kind === "ceiling" ? (
        <LightNumberField label="Ceiling drop (mm)" value={mount.ceilingDropMm} min={0} step={10}
          onChange={(ceilingDropMm) => patch("Updated light attachment.", (current) => updateLightMount(current, light.id, { kind: "ceiling", ceilingDropMm }))} />
      ) : null}
    </>
  );
}
