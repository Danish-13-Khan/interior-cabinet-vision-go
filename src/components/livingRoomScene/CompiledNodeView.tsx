import { type ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import type { Point3Mm, RenderQuality } from "../../domain/interiorProject";
import type { CompiledMaterial, CompiledSceneNode } from "../../domain/livingRoom";
import { modelSelectionTarget } from "../../domain/livingRoom/modelSelection";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { useModelAsset } from "../../rendering/loaders/useModelAsset";
import { AssetBackedObject } from "./AssetBackedObject";
import { CompiledNodeLabel } from "./CompiledNodeLabel";
import { OpeningPickVolume } from "./OpeningPickVolume";
import { ProceduralFallbackObject } from "./ProceduralFallbackObject";
import { useCompiledNodeDrag } from "./useCompiledNodeDrag";

function degrees(value: number) {
  return value * Math.PI / 180;
}

export function CompiledNodeView({
  node, materials, selected, snapSizeMm, renderMode, renderQuality, showSelectedLabel,
  onSelect, onSelectOpening, onSelectWall, onClearSelection, onMove, onDragStateChange,
  interactive, onMechanismClick, onAssetReady, onWallContextMenu,
}: {
  node: CompiledSceneNode;
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  snapSizeMm: number;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  showSelectedLabel: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onSelectWall: (wallId: string) => void;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
  interactive: boolean;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onAssetReady?: () => void;
  onWallContextMenu?: (wallId: string, point: { x: number; y: number }) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const selectionTarget = modelSelectionTarget(node);
  const sourceObjectId = selectionTarget?.kind === "object" ? selectionTarget.id : null;
  const drag = useCompiledNodeDrag(
    snapSizeMm, node.positionMm, sourceObjectId, onMove, onDragStateChange,
  );
  const position = drag.preview ?? node.positionMm;
  const modelAsset = useModelAsset(node.renderBinding);
  const useGlb = modelAsset.strategy === "glb" && modelAsset.url && modelAsset.definition;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!interactive || event.button !== 0) return;
    event.stopPropagation();
    if (!selectionTarget) { onClearSelection(); return; }
    if (selectionTarget.kind === "opening") return;
    if (selectionTarget.kind === "wall") { onSelectWall(selectionTarget.id); return; }
    const objectId = selectionTarget.id;
    const primitiveId = String(event.object.userData.primitiveId ?? "");
    if (primitiveId.startsWith("front-") && onMechanismClick) {
      onSelect(objectId, event.shiftKey || event.metaKey || event.ctrlKey);
      onMechanismClick(objectId, primitiveId);
      return;
    }
    onSelect(objectId, event.shiftKey || event.metaKey || event.ctrlKey);
    drag.beginDrag(event);
  }

  function handleWallContextMenu(event: ThreeEvent<MouseEvent>) {
    if (!interactive || !onWallContextMenu || selectionTarget?.kind !== "wall") return;
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    onSelectWall(selectionTarget.id);
    onWallContextMenu(selectionTarget.id, {
      x: event.nativeEvent.clientX, y: event.nativeEvent.clientY,
    });
  }

  return (
    <group
      userData={{
        materialId: node.primitives[0]?.materialId, objectId: node.id,
        modelPickId: selectionTarget?.id ?? null, modelPickKind: selectionTarget?.kind ?? null,
        modelPickOccluder: !selectionTarget,
      }}
      position={[position.x / 1000, position.y / 1000, position.z / 1000]}
      rotation={[degrees(node.rotationDegrees.x), degrees(node.rotationDegrees.y), degrees(node.rotationDegrees.z)]}
      onPointerOver={selectionTarget ? (event) => { event.stopPropagation(); setHovered(true); } : undefined}
      onPointerOut={selectionTarget ? () => setHovered(false) : undefined}
      onClick={selectionTarget?.kind === "opening" ? (event) => {
        event.stopPropagation();
        onSelectOpening(selectionTarget.id);
      } : undefined}
      onContextMenu={handleWallContextMenu}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.finishDrag}
      onPointerCancel={drag.finishDrag}
    >
      {useGlb ? (
        <AssetBackedObject
          url={modelAsset.url!} definition={modelAsset.definition!} binding={node.renderBinding}
          materials={materials} primitives={node.primitives} selected={selected}
          renderMode={renderMode} renderQuality={renderQuality} onReady={onAssetReady}
          onPointerDown={handlePointerDown}
        />
      ) : (
        <ProceduralFallbackObject
          primitives={node.primitives} materials={materials} selected={selected}
          renderMode={renderMode} renderQuality={renderQuality} onPointerDown={handlePointerDown}
        />
      )}
      {selectionTarget?.kind === "opening" ? (
        <OpeningPickVolume primitives={node.primitives} onPointerDown={handlePointerDown} />
      ) : null}
      <CompiledNodeLabel
        node={node} selectionTarget={selectionTarget} selected={selected} hovered={hovered}
        interactive={interactive} renderMode={renderMode} showSelectedLabel={showSelectedLabel}
        onSelect={onSelect} onSelectOpening={onSelectOpening} onSelectWall={onSelectWall}
      />
    </group>
  );
}
