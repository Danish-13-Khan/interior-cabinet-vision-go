import {
  applianceHostCandidates,
  detectApplianceInsertKind,
  HOST_REMOVED,
  HOSTED_INSERT_OPTIONS,
  INSERT_KIND,
  OFFSET_ALONG_MM,
  OFFSET_DEPTH_MM,
  placeInCabinetPatch,
  readApplianceHost,
  readHostedInsertKind,
  RELEASE_APPLIANCE_PATCH,
} from "../../domain/hostedAppliances";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
};

/** Sink / hob placement: the appliance sits on the host's worktop and moves with it (roadmap §4.4). */
export function ApplianceHostSection({ object, project, onSetParameters }: Props) {
  const mount = readApplianceHost(object);
  const hostRemoved = object.parameters[HOST_REMOVED] === true;
  const hosts = applianceHostCandidates(project, object);
  const sharing = mount
    ? project.objects.find((item) => item.id !== object.id && readApplianceHost(item)?.hostCabinetId === mount.hostCabinetId)
    : undefined;
  const insertKind = mount?.insertKind ?? readHostedInsertKind(object.parameters[INSERT_KIND]) ?? detectApplianceInsertKind(object);
  const chooseHost = (hostId: string) => {
    const host = hosts.find((item) => item.id === hostId);
    onSetParameters(object.id, host ? placeInCabinetPatch(object, host, insertKind) : RELEASE_APPLIANCE_PATCH);
  };
  return (
    <details className="lr-inspector-section lr-appliance-host" open={Boolean(mount) || hostRemoved} data-testid="appliance-host-section">
      <summary>Place in cabinet</summary>
      <div className="lr-inspector-section-body lr-appliance-host-body">
        {hostRemoved ? (
          <p role="alert" className="lr-light-alert">
            The host cabinet was removed. The appliance stays where it was; place it in another cabinet or leave it free.{" "}
            <button type="button" className="lr-appliance-dismiss" onClick={() => onSetParameters(object.id, { [HOST_REMOVED]: false })}>
              Dismiss
            </button>
          </p>
        ) : null}
        <label className="lr-render-field"><span>Cabinet</span>
          <select aria-label={`Host cabinet for ${object.name}`} data-testid="appliance-host-select"
            value={mount?.hostCabinetId ?? ""} onChange={(event) => chooseHost(event.target.value)}>
            <option value="">Not placed</option>
            {hosts.map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}
          </select>
        </label>
        <label className="lr-render-field"><span>Insert</span>
          <select aria-label={`Insert for ${object.name}`} data-testid="appliance-insert-kind" value={insertKind}
            onChange={(event) => onSetParameters(object.id, { [INSERT_KIND]: event.target.value })}>
            {HOSTED_INSERT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {mount ? (
          <>
            <NumberField label="Along" value={mount.offsetAlongMm} testId="appliance-offset-along"
              onChange={(value) => onSetParameters(object.id, { [OFFSET_ALONG_MM]: value })} />
            <NumberField label="Depth" value={mount.offsetDepthMm} testId="appliance-offset-depth"
              onChange={(value) => onSetParameters(object.id, { [OFFSET_DEPTH_MM]: value })} />
          </>
        ) : null}
        {sharing ? (
          <p className="lr-appliance-warning">{sharing.name} is also placed in this cabinet; only one insert is recorded. Move one to another cabinet.</p>
        ) : null}
        <p className="lr-inspector-hint">
          {mount
            ? "Sits on the worktop and moves or turns with the cabinet. Drag it, type X / Z, or set Along / Depth (mm from the cabinet centre) to slide it inside the cabinet. The worktop cut-out is listed in the hardware report."
            : hosts.length === 0 ? "Add a base or sink cabinet to place this in." : "Pick a base or sink cabinet to drop this into its worktop."}
        </p>
      </div>
    </details>
  );
}
