type WallDrawingPanelProps = {
  thicknessMm: number;
  onThickness: (thicknessMm: number) => void;
  onSplit: () => void;
  onDelete: () => void;
  onJoinNodes: () => void;
  canEdit: boolean;
};

export function WallDrawingPanel({
  thicknessMm,
  onThickness,
  onSplit,
  onDelete,
  onJoinNodes,
  canEdit,
}: WallDrawingPanelProps) {
  return (
    <div className="lr-build-commit">
      <p>Drag the plan to draw a wall segment. Endpoints snap to the grid and existing nodes.</p>
      <label>
        <span>Wall thickness (mm)</span>
        <input
          type="number"
          min="50"
          max="500"
          step="10"
          disabled={!canEdit}
          value={thicknessMm}
          onChange={(event) => onThickness(Number(event.target.value) || thicknessMm)}
        />
      </label>
      <div className="lr-wall-edit-actions">
        <button type="button" disabled={!canEdit} onClick={onSplit}>Split at midpoint</button>
        <button type="button" disabled={!canEdit} onClick={onDelete}>Delete wall</button>
        <button type="button" onClick={onJoinNodes}>Join coincident nodes</button>
      </div>
    </div>
  );
}
