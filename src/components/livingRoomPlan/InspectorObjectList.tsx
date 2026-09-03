import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { selectableObjectIds } from "../../domain/livingRoom/objectSelection";

type InspectorObjectListProps = {
  objects: readonly InteriorObjectEntity[];
  roomId: string;
  selectedId: string | null;
  onSelect: (objectId: string | null, additive?: boolean) => void;
};

/** Keyboard-accessible object picker so Golden Run never depends on canvas hits. */
export function InspectorObjectList({
  objects,
  roomId,
  selectedId,
  onSelect,
}: InspectorObjectListProps) {
  const ids = selectableObjectIds(objects, roomId);
  if (ids.length === 0) return null;
  return (
    <section className="lr-inspector-object-list">
      <h4>Objects</h4>
      <p className="lr-inspector-hint">Select here or use [ / ] keys. Arrow keys nudge.</p>
      <ul className="lr-millwork-lines" data-testid="inspector-object-list" aria-label="Select object">
        {objects.filter((object) => ids.includes(object.id)).map((object) => (
          <li key={object.id}>
            <button
              type="button"
              data-testid={`inspector-object-${object.id}`}
              aria-current={object.id === selectedId ? "true" : undefined}
              onClick={(event) => onSelect(object.id, event.shiftKey)}
            >
              <strong>{object.name}</strong>
              <span>{object.kind}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
