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
      <p>Draw the floor in 2D first. Raise selected walls into 3D from the inspector — switching to 3D does not extrude the whole plan. After a room exists, drag Draw Wall across it to split.</p>
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
