import type { ReactNode } from "react";
import type { InteriorProject, LightEntity } from "../../domain/interiorProject";
import { readLightMount } from "../../domain/livingRoom/lightAttachments";
import type { LightFixtureActions } from "../../hooks/livingRoomPlanEditor/lightCommands";
import { hostCaption } from "./lightFixtureEdits";
import { LightMountSection } from "./LightMountSection";
import { LightPoseSection } from "./LightPoseSection";
import { LightShadeSection } from "./LightShadeSection";
import { LightSizeSection } from "./LightSizeSection";
import { isCobShadeKind } from "../../domain/livingRoom/lightShade";
import { LightToneSection } from "./LightToneSection";

/** Same collapsible card the cabinet and wall inspectors use. */
function Section(props: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="lr-inspector-section lr-light-section" open={props.open ?? true}>
      <summary>{props.title}</summary>
      <div className="lr-inspector-section-body lr-light-fields">{props.children}</div>
    </details>
  );
}

export function LightFixtureInspector(props: {
  project: InteriorProject;
  light: LightEntity;
  actions: LightFixtureActions;
  onSelect?: () => void;
  onRemoved?: () => void;
}) {
  const { project, light, actions } = props;
  const mount = readLightMount(light);
  const poseLocked = mount.kind === "wall" || mount.kind === "object" || (mount.kind === "ceiling" && Boolean(mount.hostCutoutId));
  return (
    <div className="lr-light-inspector" data-testid="light-fixture-inspector">
      <div className="lr-inspector-section-heading"><h3>{hostCaption(project, light)}</h3></div>
      <div className="lr-object-edit-actions" aria-label="Selected light actions">
        {props.onSelect ? <button type="button" onClick={props.onSelect}>Select</button> : null}
        <button type="button" onClick={() => actions.duplicateLight(light.id)}>Duplicate</button>
        <button type="button" className="is-danger" aria-label={`Remove ${light.name}`}
          onClick={() => { props.onRemoved?.(); actions.removeLight(light.id); }}>Delete</button>
      </div>
      {light.parameters.attachmentMissing === true ? (
        <p role="alert" className="lr-light-alert">The attached host was removed. Detach or choose another mount.</p>
      ) : null}
      <Section title="Light"><LightToneSection light={light} actions={actions} /></Section>
      <Section title="Mount"><LightMountSection project={project} light={light} actions={actions} /></Section>
      <Section title="Size"><LightSizeSection light={light} actions={actions} /></Section>
      {isCobShadeKind(light.parameters.fixtureKind) ? (
        <Section title="Shade"><LightShadeSection light={light} actions={actions} /></Section>
      ) : null}
      {/* A mounted light takes its pose from the host, so these fields are read-only there. */}
      <Section title="Position" open={!poseLocked}><LightPoseSection light={light} actions={actions} /></Section>
    </div>
  );
}
