type SurfaceDrawingPanelProps = {
  pointCount: number;
  materialId: string;
  materials: Array<{ id: string; name: string; color?: string | null }>;
  onMaterialId: (materialId: string) => void;
  onClosePolygon?: () => void;
};

export function SurfaceDrawingPanel(props: SurfaceDrawingPanelProps) {
  return (
    <div className="lr-build-commit">
      <p>Click points inside the room, then close a polygon to create a floor surface zone.</p>
      <label>
        <span>Zone material</span>
        <select value={props.materialId} onChange={(event) => props.onMaterialId(event.target.value)}>
          {props.materials.map((material) => (
            <option key={material.id} value={material.id}>{material.name}</option>
          ))}
        </select>
      </label>
      <button type="button" disabled={props.pointCount < 3} onClick={props.onClosePolygon}>
        Close surface polygon ({props.pointCount})
      </button>
    </div>
  );
}
