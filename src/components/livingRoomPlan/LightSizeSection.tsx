import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { readLightMount } from "../../domain/livingRoom/lightAttachments";
import { fixtureNumber } from "../../domain/livingRoom/lightFixtureProperties";
import { lightFixtureDefinitionFor } from "../../domain/livingRoom/lightFixtureTypes";
import { LIGHT_PARAMETER_LIMITS } from "../../domain/livingRoom/lightParameterLimits";
import { updateRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import type { LightDocumentPatch } from "./lightFixtureEdits";
import { LightNumberField } from "./LightNumberField";

function has(light: LightEntity, key: string) {
  return light.parameters[key] !== undefined || lightFixtureDefinitionFor(light)?.defaults[key as "beamAngleDeg"] !== undefined;
}

export function LightSizeSection(props: {
  project: InteriorProject;
  light: LightEntity;
  onPatchDocument: LightDocumentPatch;
}) {
  const { light, onPatchDocument } = props;
  const mounted = readLightMount(light).kind !== "free";
  const fitted = light.parameters.fitHostWidth === true;
  const limits = LIGHT_PARAMETER_LIMITS;
  const set = (key: string, value: number | string) => onPatchDocument(
    (current) => updateRoomLightFixture(current, light.id, { parameters: { [key]: value } }),
    "Updated room light.",
  );
  return (
    <>
      <LightNumberField label={light.kind === "area" ? "Strip length (mm)" : "Length (mm)"}
        value={fixtureNumber(light, "widthMm", 1000)} min={limits.widthMm.min} max={limits.widthMm.max} step={50}
        disabled={mounted || fitted} onChange={(value) => set("widthMm", value)} />
      <LightNumberField label="Width (mm)" value={fixtureNumber(light, "heightMm", 20)}
        min={limits.heightMm.min} max={limits.heightMm.max} step={5} onChange={(value) => set("heightMm", value)} />
      <LightNumberField label="Depth (mm)" value={fixtureNumber(light, "depthMm", 20)}
        min={limits.depthMm.min} max={limits.depthMm.max} step={1} onChange={(value) => set("depthMm", value)} />
      {has(light, "headCount") ? (
        <LightNumberField label="Heads" value={fixtureNumber(light, "headCount", 3)}
          min={limits.headCount.min} max={limits.headCount.max} step={1} onChange={(value) => set("headCount", value)} />
      ) : null}
      {has(light, "beamAngleDeg") ? (
        <LightNumberField label="Beam (°)" value={fixtureNumber(light, "beamAngleDeg", 36)}
          min={limits.beamAngleDeg.min} max={limits.beamAngleDeg.max} step={1} onChange={(value) => set("beamAngleDeg", value)} />
      ) : null}
      {has(light, "aimAngleDeg") ? (
        <LightNumberField label="Aim (°)" value={fixtureNumber(light, "aimAngleDeg", 0)}
          min={limits.aimAngleDeg.min} max={limits.aimAngleDeg.max} step={1} onChange={(value) => set("aimAngleDeg", value)} />
      ) : null}
      {has(light, "orientation") ? (
        <label className="lr-render-field"><span>Orientation</span>
          <select aria-label={`Orientation for ${light.name}`} value={String(light.parameters.orientation ?? "horizontal")}
            onChange={(event) => set("orientation", event.target.value)}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </label>
      ) : null}
      {has(light, "profileFinish") ? (
        <label className="lr-render-field"><span>Finish</span>
          <select aria-label={`Finish for ${light.name}`} value={String(light.parameters.profileFinish ?? "aluminium")}
            onChange={(event) => set("profileFinish", event.target.value)}>
            <option value="aluminium">Aluminium</option>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </label>
      ) : null}
    </>
  );
}
