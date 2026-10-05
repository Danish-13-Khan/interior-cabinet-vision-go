import type { CabinetType } from "../../domain/cabinetCapabilities";
import {
  FRONT_SYSTEM_PARAMETER,
  GOLA_PROFILE_CATALOG,
  clampGolaProfileSize,
  defaultGolaProfiles,
  frontSystemFromParameters,
  golaParameterKey,
  golaProfilesForType,
  type GolaProfileKind,
  type GolaProfileSize,
} from "../../domain/frontSystem";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  cabinetType: CabinetType;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
};

/** Handles vs gola handleless, with profile sizes clamped to the standard ranges. */
export function GolaFrontFields({ object, cabinetType, onSetParameters }: Props) {
  const system = frontSystemFromParameters(object.parameters);
  const gola = system?.kind === "gola";
  const profiles = system?.kind === "gola" ? system.profiles : defaultGolaProfiles();
  const setSize = (kind: GolaProfileKind, dimension: keyof GolaProfileSize, value: number) => {
    const size = clampGolaProfileSize(kind, { ...profiles[kind], [dimension]: value });
    onSetParameters(object.id, { [golaParameterKey(kind, dimension)]: size[dimension] });
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
