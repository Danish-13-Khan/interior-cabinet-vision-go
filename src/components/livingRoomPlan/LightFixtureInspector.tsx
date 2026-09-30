import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { hostCaption } from "./lightFixtureEdits";
import { LightMountSection } from "./LightMountSection";
import { LightPoseSection } from "./LightPoseSection";
import { LightSizeSection } from "./LightSizeSection";
import { LightToneSection } from "./LightToneSection";

export function LightFixtureInspector(props: {
  project: InteriorProject;
  light: LightEntity;
  actions: LightFixtureActions;
  onSelect?: () => void;
  onRemoved?: () => void;
}) {
  const { project, light, actions } = props;
  return (
    <div className="lr-light-inspector" data-testid="light-fixture-inspector">
      <div className="lr-inspector-section-heading"><h3>{hostCaption(project, light)}</h3></div>
      {props.onSelect ? <button type="button" onClick={props.onSelect}>Select</button> : null}
      {light.parameters.attachmentMissing === true ? (
        <p role="alert">The attached host was removed. Detach or choose another mount.</p>
      ) : null}
      <LightMountSection project={project} light={light} actions={actions} />
      <LightSizeSection light={light} actions={actions} />
      <LightToneSection light={light} actions={actions} />
      <LightPoseSection light={light} actions={actions} />
      <button type="button" onClick={() => actions.duplicateLight(light.id)}>Duplicate</button>
      <button type="button" onClick={() => { props.onRemoved?.(); actions.removeLight(light.id); }}>Remove {light.name}</button>
    </div>
  );
}
