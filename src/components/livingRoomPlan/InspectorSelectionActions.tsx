export function InspectorSelectionActions(props: {
  hasObject: boolean;
  onRotate?: () => void;
  onDuplicate: () => void;
  onMaterial?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="lr-inspector-object-actions" aria-label="Selected object actions">
      <button type="button" onClick={props.onRotate} disabled={!props.hasObject || !props.onRotate}>Rotate</button>
      <button type="button" data-testid="inspector-duplicate" onClick={props.onDuplicate} disabled={!props.hasObject}>Duplicate</button>
      <button type="button" onClick={props.onMaterial} disabled={!props.onMaterial}>Material</button>
      <button type="button" data-testid="inspector-delete" className="is-danger" onClick={props.onDelete} disabled={!props.hasObject}>Delete</button>
    </div>
  );
}
