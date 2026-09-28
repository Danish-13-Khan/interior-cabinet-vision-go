import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { cabinetFinishId } from "../../domain/livingRoom";
import { InspectorSection } from "./InspectorSection";
import { NumberField } from "./NumberField";

type Props = {
  object: InteriorObjectEntity;
  onSetParameters: (objectId: string, patch: Record<string, string | number | boolean>) => void;
};

/** Cabinet finish, door style and box counts (collapsed by default). */
export function CabinetConstructionSection({ object, onSetParameters }: Props) {
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
        <select data-testid="cabinet-door-style" value={String(object.parameters.doorStyle ?? "slab")}
          onChange={(event) => onSetParameters(object.id, { doorStyle: event.target.value })}>
          <option value="slab">Slab</option>
          <option value="shaker">Shaker</option>
          <option value="glass">Glass</option>
        </select>
      </label>
      <NumberField label="Door count" value={Number(object.parameters.doorCount) || 2}
        onChange={(doorCount) => onSetParameters(object.id, { doorCount: Math.max(1, Math.round(doorCount)) })} />
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
