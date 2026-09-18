import type { Dispatch, SetStateAction } from "react";
import type { Point3Mm, RenderQuality } from "../../domain/interiorProject";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import { samePoint3Mm } from "../../domain/livingRoom/objectOrbitDragPolicy";
import { modelNodeIsSelected, modelSelectionTarget } from "../../domain/livingRoom/modelSelection";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { CompiledNodeView } from "./CompiledNodeView";
import { ModelMoveGizmo, type ModelTransformTarget } from "./ModelMoveGizmo";

function wallFragmentArea(node: CompiledLivingRoomScene["nodes"][number]) {
  return node.primitives.reduce((area, primitive) => {
    if (primitive.kind !== "box" && primitive.kind !== "rounded-box") return area;
    return area + primitive.sizeMm.width * primitive.sizeMm.height;
  }, 0);
}

function selectedWallLabelNodeId(
  nodes: CompiledLivingRoomScene["nodes"],
  selectedWallId: string | null,
) {
  if (!selectedWallId) return null;
  return nodes
    .filter((node) => modelSelectionTarget(node)?.kind === "wall"
      && node.metadata.wallId === selectedWallId)
    .sort((left, right) => wallFragmentArea(right) - wallFragmentArea(left))[0]?.id ?? null;
}

function latchPreview(
  setTransformPreview: Dispatch<SetStateAction<Point3Mm | null>>,
  resolved: Point3Mm,
) {
  setTransformPreview((previous) => (
    previous && samePoint3Mm(previous, resolved) ? previous : resolved
  ));
}

export function CompiledSceneObjectLayer(props: {
  nodes: CompiledLivingRoomScene["nodes"];
  materials: Map<string, CompiledLivingRoomScene["materials"][number]>;
  selectedIds: string[];
  selectedOpeningId: string | null;
  selectedWallId: string | null;
  snapSizeMm: number;
  renderMode: RenderMode;
  renderQuality: RenderQuality;
  glbCasterSlots: Map<string, number>;
  maxGlbCasters?: number;
  interactive: boolean;
  transformTarget: ModelTransformTarget | null;
  transformPreview: Point3Mm | null;
  setTransformPreview: Dispatch<SetStateAction<Point3Mm | null>>;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onTransformPreview?: (target: ModelTransformTarget, position: Point3Mm) => Point3Mm;
  onTransformCommit?: (target: ModelTransformTarget, position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onAssetReady: () => void;
  onWallContextMenu?: (wallId: string, point: { x: number; y: number }) => void;
}) {
  const wallLabelId = selectedWallLabelNodeId(props.nodes, props.selectedWallId);
  return (
    <>
      {props.nodes.map((node) => {
        const target = modelSelectionTarget(node);
        const transformsNode = Boolean(props.transformTarget && target
          && props.transformTarget.kind === target.kind
          && props.transformTarget.id === target.id);
        const preview = transformsNode && props.transformPreview && props.transformTarget
          ? {
              x: node.positionMm.x + props.transformPreview.x - props.transformTarget.positionMm.x,
              y: node.positionMm.y + props.transformPreview.y - props.transformTarget.positionMm.y,
              z: node.positionMm.z + props.transformPreview.z - props.transformTarget.positionMm.z,
            }
          : undefined;
        return <CompiledNodeView
          key={node.id}
          node={node}
          materials={props.materials}
          selected={modelNodeIsSelected(node, {
            objectIds: props.selectedIds,
            openingId: props.selectedOpeningId,
            wallId: props.selectedWallId,
          })}
          snapSizeMm={props.snapSizeMm}
          renderMode={props.renderMode}
          renderQuality={props.renderQuality}
          glbCasterSlot={props.glbCasterSlots.get(node.id)}
          maxGlbCasters={props.maxGlbCasters}
          showSelectedLabel={modelSelectionTarget(node)?.kind !== "wall" || node.id === wallLabelId}
          onSelect={props.onSelect}
          onSelectOpening={props.onSelectOpening}
          onSelectWall={props.onSelectWall}
          onClearSelection={props.onClearSelection}
          onMove={(objectId, position) => {
            if (
              props.transformTarget?.kind === "object"
              && props.transformTarget.id === objectId
              && props.onTransformCommit
            ) {
              props.onTransformCommit(props.transformTarget, position);
              props.setTransformPreview(null);
              return;
            }
            props.onMove(objectId, position);
          }}
          onMovePreview={(objectId, position) => {
            if (props.transformTarget?.kind !== "object"
              || props.transformTarget.id !== objectId) return position;
            const resolved = props.onTransformPreview?.(props.transformTarget, position)
              ?? position;
            latchPreview(props.setTransformPreview, resolved);
            return resolved;
          }}
          onDragStateChange={props.onDragStateChange}
          interactive={props.interactive}
          onMechanismClick={props.onMechanismClick}
          onAssetReady={props.onAssetReady}
          onWallContextMenu={props.onWallContextMenu}
          positionOverride={preview}
        />;
      })}
      {props.interactive && props.transformTarget ? (
        <ModelMoveGizmo
          target={props.transformTarget}
          positionOverride={props.transformPreview}
          snapSizeMm={props.snapSizeMm}
          onPreview={(position) => {
            const resolved = props.onTransformPreview?.(props.transformTarget!, position)
              ?? position;
            latchPreview(props.setTransformPreview, resolved);
            return resolved;
          }}
          onCommit={(position) => {
            props.onTransformCommit?.(props.transformTarget!, position);
            props.setTransformPreview(null);
          }}
          onDragStateChange={props.onDragStateChange}
        />
      ) : null}
    </>
  );
}
