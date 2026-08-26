type RoomDrawingPanelProps = {
  pointCount: number;
  onClosePolygon?: () => void;
};

export function RoomDrawingPanel({ pointCount, onClosePolygon }: RoomDrawingPanelProps) {
  return (
    <div className="lr-build-commit">
      <p>Drag the plan for a rectangle, or click three or more points then close the polygon.</p>
      <button type="button" disabled={pointCount < 3} onClick={onClosePolygon}>
        Close polygon ({pointCount})
      </button>
    </div>
  );
}
