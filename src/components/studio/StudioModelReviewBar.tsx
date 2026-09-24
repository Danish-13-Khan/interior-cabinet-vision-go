export function StudioModelReviewBar(props: {
  onMeasure: () => void;
  onFrame: () => void;
  onMaterials: () => void;
}) {
  return (
    <div className="studio-review-bar" role="toolbar" aria-label="3D review">
      <span className="is-active">Orbit</span>
      <button type="button" onClick={props.onMeasure}>Measure</button>
      <button type="button" onClick={props.onFrame}>Frame</button>
      <button type="button" onClick={props.onMaterials}>Materials</button>
    </div>
  );
}
