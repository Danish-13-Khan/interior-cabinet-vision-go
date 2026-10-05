import type { LightEntity } from "../../domain/interiorProject";
import { readLightMount } from "../../domain/livingRoom/lightAttachments";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { LightNumberField } from "./LightNumberField";

export function LightPoseSection(props: { light: LightEntity; actions: LightFixtureActions }) {
  const { light, actions } = props;
  const mount = readLightMount(light);
  const locked = mount.kind !== "free";
  const where = mount.kind === "wall" ? "Along wall and Centre height"
    : mount.kind === "ceiling" ? "Ceiling drop, or drag it in 3D"
    : "the cabinet it is fixed to";
  const set = (patch: Parameters<LightFixtureActions["updateLight"]>[1]) => actions.updateLight(light.id, patch);
  return (
    <>
      {locked ? (
        <p className="lr-authoring-hint" data-testid="light-position-locked">
          This light follows its mount, so these fields are read-only. Move it with {where} in Mount,
          or set Mount to Free to place it anywhere.
        </p>
      ) : null}
      {([
        ["x", "X (mm)"],
        ["y", "Height (mm)"],
        ["z", "Z (mm)"],
      ] as const).map(([axis, label]) => (
        <LightNumberField key={axis} label={label} value={light.position[axis]} step={10}
          disabled={mount.kind === "ceiling" ? axis === "y" : locked}
          onChange={(value) => set({ position: { ...light.position, [axis]: value } })} />
      ))}
      {([
        ["x", "Rotate X (°)"],
        ["y", "Rotate (°)"],
        ["z", "Rotate Z (°)"],
      ] as const).map(([axis, label]) => (
        <LightNumberField key={`rot-${axis}`} label={label} value={light.rotation[axis]} step={5} disabled={locked}
          onChange={(value) => set({ rotation: { ...light.rotation, [axis]: value } })} />
      ))}
    </>
  );
}
