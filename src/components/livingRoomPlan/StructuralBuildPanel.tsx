import { WallDrawingPanel } from "./WallDrawingPanel";

type StructuralBuildPanelProps = {
  tool: "draw-partition" | "place-column";
  thicknessMm: number;
  canEditWall: boolean;
  onAddPartitionWall: () => void;
  onThickness: (thicknessMm: number) => void;
  onSplit: () => void;
  onDelete: () => void;
  onJoinNodes: () => void;
};

export function StructuralBuildPanel(props: StructuralBuildPanelProps) {
  if (props.tool === "place-column") {
    return (
      <div className="lr-build-commit">
        <p>Click the plan to place a structural column. Columns snap to the grid and stay inside the room.</p>
      </div>
    );
  }
  return (
    <section className="lr-room-authoring lr-build-commit">
      <strong>Draw Partition · armed</strong>
      <p>Drag segments for interior partitions, or commit a centered starter wall.</p>
      <button type="button" className="lr-add-partition" onClick={props.onAddPartitionWall}>+ Add starter partition</button>
      <WallDrawingPanel
        thicknessMm={props.thicknessMm}
        canEdit={props.canEditWall}
        onThickness={props.onThickness}
        onSplit={props.onSplit}
        onDelete={props.onDelete}
        onJoinNodes={props.onJoinNodes}
      />
    </section>
  );
}
