import { supportsDoors, supportsDrawers } from "../../domain/cabinetCapabilities";
import { readCabinetIdentity } from "../../domain/cabinetIdentity";
import { DOOR_SOURCING_PARAMETER, DOOR_STYLE_OPTIONS, DOOR_STYLE_PARAMETER, readDoorStyleKind } from "../../domain/frontSystem";
import { GolaFrontFields } from "./GolaFrontFields";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { cabinetFinishId } from "../../domain/livingRoom";
import { InspectorSection } from "./InspectorSection";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  project: InteriorProject;
  onSetParameters: (objectId: string | readonly string[], patch: Record<string, string | number | boolean>) => void;
};

/** Cabinet finish, door style and box counts (collapsed by default). */
export function CabinetConstructionSection({ object, project, onSetParameters }: Props) {
  const identity = readCabinetIdentity(object);
  const compiled = identity !== null;
  const doorStyle = readDoorStyleKind(object.parameters[DOOR_STYLE_PARAMETER]);
  return (
    <InspectorSection title="Construction" testId="inspector-cabinet-advanced">
      <label className="lr-select-field"><span>Finish</span>
        <select data-testid="cabinet-finish" value={cabinetFinishId(object)}
          onChange={(event) => onSetParameters(object.id, { finishId: event.target.value })}>
          <option value="wood-oak">Oak Woodgrain</option>
          <option value="wood-walnut">Walnut</option>
          <option value="white-matte">White Matte</option>
          <option value="grey">Grey Matte</option>
        </select>
      </label>
      <label className="lr-select-field"><span>Door style</span>
        <select data-testid="cabinet-door-style" value={doorStyle}
          onChange={(event) => onSetParameters(object.id, { [DOOR_STYLE_PARAMETER]: event.target.value })}>
          {DOOR_STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {doorStyle !== "slab" ? (
        <label className="lr-select-field"><span>Doors made</span>
          <select data-testid="cabinet-door-sourcing" value={object.parameters[DOOR_SOURCING_PARAMETER] === "in-house" ? "in-house" : "bought"}
            onChange={(event) => onSetParameters(object.id, { [DOOR_SOURCING_PARAMETER]: event.target.value })}>
            <option value="bought">Bought ready-made</option>
            <option value="in-house">Made in-house (frame parts on the cut list)</option>
          </select>
        </label>
      ) : null}
      {identity && (supportsDoors(identity.cabinetType) || supportsDrawers(identity.cabinetType)) ? (
        <GolaFrontFields object={object} project={project} cabinetType={identity.cabinetType} onSetParameters={onSetParameters} />
      ) : null}
      {compiled ? (
        <p className="lr-inspector-hint" data-testid="cabinet-door-count-auto">Door count: auto from width</p>
      ) : (
        <NumberField label="Door count" value={Number(object.parameters.doorCount) || 2}
          onChange={(doorCount) => onSetParameters(object.id, { doorCount: Math.max(1, Math.round(doorCount)) })} />
      )}
      <NumberField label="Drawer count" value={Number(object.parameters.drawerCount) || 0}
        onChange={(drawerCount) => onSetParameters(object.id, { drawerCount: Math.max(0, Math.round(drawerCount)) })} />
      <NumberField label="Shelf count" value={Number(object.parameters.shelfCount) || 0}
        onChange={(shelfCount) => onSetParameters(object.id, { shelfCount: Math.max(0, Math.round(shelfCount)) })} />
      <p className="lr-inspector-hint" data-wall-snapped={object.extensions?.wallAttachment ? "true" : "false"}>
        {object.extensions?.wallAttachment
          ? "Wall snapped — drag near another wall to reattach."
          : "Drag near a wall to snap this cabinet."}
      </p>
    </InspectorSection>
  );
}
