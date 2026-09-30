import type { LightEntity } from "../../domain/interiorProject";
import { readLightMount } from "../../domain/livingRoom/lightAttachments";
import { updateRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import type { LightDocumentPatch } from "./lightFixtureEdits";
import { LightNumberField } from "./LightNumberField";

export function LightPoseSection(props: { light: LightEntity; onPatchDocument: LightDocumentPatch }) {
  const { light, onPatchDocument } = props;
  const locked = readLightMount(light).kind !== "free";
  const set = (patch: Parameters<typeof updateRoomLightFixture>[2]) => onPatchDocument(
    (current) => updateRoomLightFixture(current, light.id, patch),
    "Updated room light.",
  );
  return (
    <>
      {([
        ["x", "X (mm)"],
        ["y", "Height (mm)"],
        ["z", "Z (mm)"],
      ] as const).map(([axis, label]) => (
        <LightNumberField key={axis} label={label} value={light.position[axis]} step={10} disabled={locked}
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
