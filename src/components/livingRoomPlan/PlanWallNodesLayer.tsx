import type { PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm } from "../../domain/interiorProject";
import type { WallTranslatePreview } from "./usePlanWallInteraction";

export function PlanWallNodesLayer(props: {
  project: InteriorProject;
  activeWallId: string | null;
  editable: boolean;
  previewNodes: Map<string, Point2Mm>;
  translatePreview: WallTranslatePreview | null;
  onNodePointerDown: (event: ReactPointerEvent<SVGCircleElement>, nodeId: string) => void;
}) {
  if (!props.editable) return null;
  const nodeIds = new Set<string>();
  for (const wall of props.project.walls) {
    if (!wall.visible) continue;
    if (props.activeWallId && wall.id !== props.activeWallId) continue;
    if (wall.startNodeId) nodeIds.add(wall.startNodeId);
    if (wall.endNodeId) nodeIds.add(wall.endNodeId);
  }
  // When nothing is selected, show all graph nodes so corners stay editable.
  if (!props.activeWallId) {
    for (const node of props.project.nodes) nodeIds.add(node.id);
  }

  return (
    <g className="lr-wall-nodes" pointerEvents="auto">
      {props.translatePreview ? (
        <line
          className="lr-wall-translate-preview"
          x1={props.translatePreview.start.x}
          y1={props.translatePreview.start.z}
          x2={props.translatePreview.end.x}
          y2={props.translatePreview.end.z}
          pointerEvents="none"
        />
      ) : null}
      {[...nodeIds].map((nodeId) => {
        const node = props.project.nodes.find((item) => item.id === nodeId);
        if (!node) return null;
        const position = props.previewNodes.get(nodeId) ?? node.position;
        return (
          <circle
            key={nodeId}
            data-node-id={nodeId}
            className="lr-wall-node-handle"
            cx={position.x}
            cy={position.z}
            r={70}
            onPointerDown={(event) => props.onNodePointerDown(event, nodeId)}
          />
        );
      })}
    </g>
  );
}
