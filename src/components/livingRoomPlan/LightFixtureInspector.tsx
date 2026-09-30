import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { duplicateRoomLightFixture, removeRoomLightFixture } from "../../domain/livingRoom/roomLightFixtures";
import { hostCaption, type LightDocumentPatch } from "./lightFixtureEdits";
import { LightMountSection } from "./LightMountSection";
import { LightPoseSection } from "./LightPoseSection";
import { LightSizeSection } from "./LightSizeSection";
import { LightToneSection } from "./LightToneSection";

export function LightFixtureInspector(props: {
  project: InteriorProject;
  light: LightEntity;
  onPatchDocument: LightDocumentPatch;
  onSelect?: () => void;
  onRemoved?: () => void;
}) {
  const { project, light, onPatchDocument } = props;
  return (
    <div className="lr-light-inspector" data-testid="light-fixture-inspector">
      <div className="lr-inspector-section-heading"><h3>{hostCaption(project, light)}</h3></div>
      {props.onSelect ? <button type="button" onClick={props.onSelect}>Select</button> : null}
      {light.parameters.attachmentMissing === true ? (
        <p role="alert">The attached host was removed. Detach or choose another mount.</p>
      ) : null}
      <LightMountSection project={project} light={light} onPatchDocument={onPatchDocument} />
      <LightSizeSection project={project} light={light} onPatchDocument={onPatchDocument} />
      <LightToneSection light={light} onPatchDocument={onPatchDocument} />
      <LightPoseSection light={light} onPatchDocument={onPatchDocument} />
      <button type="button" onClick={() => onPatchDocument(
        (current) => duplicateRoomLightFixture(current, light.id),
        "Duplicated room light.",
      )}>Duplicate</button>
      <button type="button" onClick={() => {
        props.onRemoved?.();
        onPatchDocument((current) => removeRoomLightFixture(current, light.id), "Removed room light.");
      }}>Remove {light.name}</button>
    </div>
  );
}
