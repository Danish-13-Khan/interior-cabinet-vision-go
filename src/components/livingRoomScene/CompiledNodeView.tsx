import { type ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import { Plane, Vector3 } from "three";
import type { Point3Mm, RenderQuality } from "../../domain/interiorProject";
import type { CompiledMaterial, CompiledSceneNode } from "../../domain/livingRoom";
import { modelSelectionTarget } from "../../domain/livingRoom/modelSelection";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { useModelAsset } from "../../rendering/loaders/useModelAsset";
import { AssetBackedObject } from "./AssetBackedObject";
import { CompiledNodeLabel } from "./CompiledNodeLabel";
import { OpeningPickVolume } from "./OpeningPickVolume";
import { ProceduralFallbackObject } from "./ProceduralFallbackObject";

const FLOOR_DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0);

type DragState = {
  pointerId: number;
  startPoint: Vector3;
  startPosition: Point3Mm;
};

function degrees(value: number) {
  return value * Math.PI / 180;
}

export function CompiledNodeView({
  node,
  materials,
  selected,
  snapSizeMm,
  renderMode,
  renderQuality,
  onSelect,
  onSelectOpening,
  onClearSelection,
  onMove,
  onDragStateChange,
  interactive,
  onMechanismClick,
  onAssetReady,
}: {
  node: CompiledSceneNode;
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  snapSizeMm: number;
  renderMode: RenderMode;
  renderQuality?: RenderQuality;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectOpening: (openingId: string) => void;
  onClearSelection: () => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
  interactive: boolean;
  onMechanismClick?: (objectId: string, primitiveId: string) => void;
  onAssetReady?: () => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Point3Mm | null>(null);
  const [hovered, setHovered] = useState(false);
  const selectionTarget = modelSelectionTarget(node);
  const sourceObjectId = selectionTarget?.kind === "object" ? selectionTarget.id : null;
  const position = preview ?? node.positionMm;
  const modelAsset = useModelAsset(node.renderBinding);
  const useGlb = modelAsset.strategy === "glb"
    && modelAsset.url
    && modelAsset.definition;

  function groundPoint(event: ThreeEvent<PointerEvent>) {
    const result = new Vector3();
    return event.ray.intersectPlane(FLOOR_DRAG_PLANE, result) ? result : null;
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!interactive || event.button !== 0) return;
    event.stopPropagation();
    if (!selectionTarget) {
      onClearSelection();
      return;
    }
    if (selectionTarget.kind === "opening") {
      return;
    }
    const objectId = selectionTarget.id;
    const primitiveId = String(event.object.userData.primitiveId ?? "");
    if (primitiveId.startsWith("front-") && onMechanismClick) {
      onSelect(objectId, event.shiftKey || event.metaKey || event.ctrlKey);
      onMechanismClick(objectId, primitiveId);
      return;
    }
    onSelect(objectId, event.shiftKey || event.metaKey || event.ctrlKey);
    const point = groundPoint(event);
    if (!point || event.shiftKey || event.metaKey || event.ctrlKey) return;
    (event.nativeEvent.target as Element | null)?.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, startPoint: point, startPosition: node.positionMm });
    setPreview({ ...node.positionMm });
    onDragStateChange(true);
  }

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!interactive || selectionTarget?.kind !== "opening") return;
    event.stopPropagation();
    onSelectOpening(selectionTarget.id);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = groundPoint(event);
    if (!point) return;
    setPreview({
      ...drag.startPosition,
      x: Math.round((drag.startPosition.x + (point.x - drag.startPoint.x) * 1000) / snapSizeMm) * snapSizeMm,
      z: Math.round((drag.startPosition.z + (point.z - drag.startPoint.z) * 1000) / snapSizeMm) * snapSizeMm,
    });
  }

  function finishDrag(event: ThreeEvent<PointerEvent>) {
    if (!drag || drag.pointerId !== event.pointerId || !sourceObjectId) return;
    event.stopPropagation();
    (event.nativeEvent.target as Element | null)?.releasePointerCapture(event.pointerId);
    if (preview && (preview.x !== drag.startPosition.x || preview.z !== drag.startPosition.z)) {
      onMove(sourceObjectId, preview);
    }
    setDrag(null);
    setPreview(null);
    onDragStateChange(false);
  }

  return (
    <group
      userData={{
        materialId: node.primitives[0]?.materialId,
        objectId: node.id,
        modelPickId: selectionTarget?.id ?? null,
        modelPickKind: selectionTarget?.kind ?? null,
        modelPickOccluder: !selectionTarget,
      }}
      position={[position.x / 1000, position.y / 1000, position.z / 1000]}
      rotation={[
        degrees(node.rotationDegrees.x),
        degrees(node.rotationDegrees.y),
        degrees(node.rotationDegrees.z),
      ]}
      onPointerOver={selectionTarget ? (event) => {
        event.stopPropagation();
        setHovered(true);
      } : undefined}
      onPointerOut={selectionTarget ? () => setHovered(false) : undefined}
      onClick={selectionTarget?.kind === "opening" ? handleClick : undefined}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {useGlb ? (
        <AssetBackedObject
          url={modelAsset.url!}
          definition={modelAsset.definition!}
          binding={node.renderBinding}
          materials={materials}
          primitives={node.primitives}
          selected={selected}
          renderMode={renderMode}
          renderQuality={renderQuality}
          onReady={onAssetReady}
          onPointerDown={handlePointerDown}
        />
      ) : (
        <ProceduralFallbackObject
          primitives={node.primitives}
          materials={materials}
          selected={selected}
          renderMode={renderMode}
          renderQuality={renderQuality}
          onPointerDown={handlePointerDown}
        />
      )}
      {selectionTarget?.kind === "opening" ? (
        <OpeningPickVolume primitives={node.primitives} onPointerDown={handlePointerDown} />
      ) : null}
      <CompiledNodeLabel
        node={node}
        selectionTarget={selectionTarget}
        selected={selected}
        hovered={hovered}
        interactive={interactive}
        renderMode={renderMode}
        onSelect={onSelect}
        onSelectOpening={onSelectOpening}
      />
    </group>
  );
}
