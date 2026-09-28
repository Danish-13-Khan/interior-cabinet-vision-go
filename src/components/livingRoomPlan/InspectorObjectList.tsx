import { createPortal } from "react-dom";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { selectableObjectIds } from "../../domain/livingRoom/objectSelection";
import { useSceneListSlot } from "./InspectorPlanSettingsSlot";

type InspectorObjectListProps = {
  objects: readonly InteriorObjectEntity[];
  roomId: string;
  selectedId: string | null;
  onSelect: (objectId: string | null, additive?: boolean) => void;
};

/**
 * Keyboard-accessible "Scene" object picker so Golden Run never depends on
 * canvas hits. Lives in the left rail when it is shown, else in the inspector.
 */
export function InspectorObjectList({
  objects,
  roomId,
  selectedId,
  onSelect,
}: InspectorObjectListProps) {
  const railSlot = useSceneListSlot();
  const ids = selectableObjectIds(objects, roomId);
  if (ids.length === 0) return null;
  const content = (
    <details className="lr-inspector-object-list lr-scene-section" open>
      <summary>
        Scene <small>{ids.length} object{ids.length === 1 ? "" : "s"}</small>
      </summary>
      <p className="lr-inspector-hint">Select here or use [ / ] keys. Arrow keys nudge.</p>
      <ul className="lr-millwork-lines" data-testid="inspector-object-list" aria-label="Select object">
        {objects.filter((object) => ids.includes(object.id)).map((object) => (
          <li key={object.id}>
            <button
              type="button"
              data-testid={`inspector-object-${object.id}`}
              data-catalog-item-id={object.catalogItemId}
              aria-current={object.id === selectedId ? "true" : undefined}
              onClick={(event) => onSelect(object.id, event.shiftKey)}
            >
              <strong>{object.name}</strong>
              <span>{object.kind}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
  return railSlot ? createPortal(content, railSlot) : content;
}
