import type { CabinetType } from "../../domain/cabinetCapabilities";
import {
  FRONT_SYSTEM_PARAMETER,
  GOLA_PROFILE_CATALOG,
  clampGolaProfileSize,
  defaultGolaProfiles,
  frontSystemFromParameters,
  golaParameterKey,
  golaParametersPatch,
  golaProfilesForType,
  type GolaProfileKind,
  type GolaProfileSize,
} from "../../domain/frontSystem";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { golaFrontsKeepingHandles, golaRunMismatch } from "../../domain/livingRoom/golaRunChecks";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  cabinetType: CabinetType;
  onSetParameters: (objectId: string | readonly string[], patch: Record<string, string | number | boolean>) => void;
};

/** Handles vs gola handleless, with profile sizes clamped to the standard ranges. */
export function GolaFrontFields({ object, project, cabinetType, onSetParameters }: Props) {
  const system = frontSystemFromParameters(object.parameters);
  const gola = system?.kind === "gola";
  const profiles = system?.kind === "gola" ? system.profiles : defaultGolaProfiles();
  const handles = gola ? golaFrontsKeepingHandles(object) : 0;
  const mismatch = gola ? golaRunMismatch(project, object) : null;
  const setSize = (kind: GolaProfileKind, dimension: keyof GolaProfileSize, value: number) => {
    const size = clampGolaProfileSize(kind, { ...profiles[kind], [dimension]: value });
    onSetParameters(object.id, { [golaParameterKey(kind, dimension)]: size[dimension] });
  };
  const matchRun = () => {
    if (mismatch) onSetParameters(mismatch.memberIds, golaParametersPatch(mismatch.profiles));
  };
  return (
    <div className="lr-gola-fields" data-testid="cabinet-gola-fields">
      <label className="lr-select-field"><span>Fronts</span>
        <select data-testid="cabinet-front-system" value={gola ? "gola" : "handled"}
          onChange={(event) => onSetParameters(object.id, { [FRONT_SYSTEM_PARAMETER]: event.target.value })}>
          <option value="handled">Handles</option>
          <option value="gola">Gola handleless</option>
        </select>
      </label>
      {handles > 0 ? (
        <p className="lr-gola-warning" role="status" data-testid="cabinet-gola-handle-warning">
          {handles} front{handles === 1 ? " has" : "s have"} no gola profile to pull on and keep{handles === 1 ? "s" : ""} a handle.
        </p>
      ) : null}
      {mismatch ? (
        <p className="lr-gola-warning" role="status" data-testid="cabinet-gola-run-warning">
          {mismatch.differingIds.length} cabinet{mismatch.differingIds.length === 1 ? "" : "s"} in this run
          {mismatch.differingIds.length === 1 ? " uses" : " use"} other gola sizes or handles, so the profile will not line up.{" "}
          <button type="button" className="lr-gola-match-run" data-testid="cabinet-gola-match-run" onClick={matchRun}>
            Match run
          </button>
        </p>
      ) : null}
      {gola ? golaProfilesForType(cabinetType).map((kind) => {
        const entry = GOLA_PROFILE_CATALOG[kind];
        return (
          <fieldset key={kind} className="lr-gola-profile" data-testid={`cabinet-gola-${kind}`}>
            <legend>{entry.label}</legend>
            <p className="lr-inspector-hint">{entry.application}</p>
            <NumberField label="Height" precision={1} value={profiles[kind].heightMm}
              testId={`cabinet-gola-${kind}-height`} onChange={(value) => setSize(kind, "heightMm", value)} />
            <NumberField label="Depth" precision={1} value={profiles[kind].depthMm}
              testId={`cabinet-gola-${kind}-depth`} onChange={(value) => setSize(kind, "depthMm", value)} />
            <p className="lr-inspector-hint">
              Standard {entry.heightMm.min}–{entry.heightMm.max} mm high, {entry.depthMm.min}–{entry.depthMm.max} mm deep.
            </p>
          </fieldset>
        );
      }) : null}
    </div>
  );
}
