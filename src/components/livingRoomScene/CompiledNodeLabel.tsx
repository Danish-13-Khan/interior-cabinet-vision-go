import { Html } from "@react-three/drei";
import type { CompiledSceneNode } from "../../domain/livingRoom";
import {
  compiledNodeLabelText,
  compiledNodeLabelVisible,
} from "../../domain/livingRoom/compiledNodeLabel";
import type { ModelSelectionTarget } from "../../domain/livingRoom/modelSelection";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";

export function CompiledNodeLabel({
  node,
  selectionTarget,
  selected,
  hovered,
  interactive,
  renderMode,
  showSelectedLabel,
  onSelect,
  onSelectOpening,
  onSelectWall,
}: {
  node: CompiledSceneNode;
  selectionTarget: ModelSelectionTarget | null;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  renderMode: RenderMode;
  showSelectedLabel: boolean;
  onSelect: (objectId: string, additive: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
}) {
  if (!selectionTarget || !compiledNodeLabelVisible(node, {
    interactive,
    selected,
    hovered,
    renderMode,
    showSelectedLabel,
  })) {
    return null;
  }
  const top = Math.max(0.3, ...node.primitives.map((primitive) => primitive.positionMm.y / 1000));
  return (
    <Html position={[0, top + 0.35, 0]} center distanceFactor={7}>
      <button
        type="button"
        className={`lr-model-object-label is-pickable ${selected ? "is-selected" : ""} ${node.placeholder ? "is-placeholder" : ""}`}
        data-model-select={selectionTarget?.kind ?? "object"}
        data-model-id={selectionTarget?.id ?? node.id}
        aria-label={`Select ${node.name}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          if (!selectionTarget) return;
          if (selectionTarget.kind === "opening") onSelectOpening(selectionTarget.id);
          else if (selectionTarget.kind === "wall") onSelectWall(selectionTarget.id);
          else onSelect(selectionTarget.id, event.shiftKey || event.metaKey || event.ctrlKey);
        }}
      >
        {compiledNodeLabelText(node)}
      </button>
    </Html>
  );
}
