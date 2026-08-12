import { Html } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import { Plane, Vector3 } from "three";
import type { Point3Mm } from "../../domain/interiorProject";
import type { CompiledMaterial, CompiledSceneNode } from "../../domain/livingRoom";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { useModelAsset } from "../../rendering/loaders/useModelAsset";
import { AssetBackedObject } from "./AssetBackedObject";
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
  onSelect,
  onMove,
  onDragStateChange,
  interactive,
}: {
  node: CompiledSceneNode;
  materials: Map<string, CompiledMaterial>;
  selected: boolean;
  snapSizeMm: number;
  renderMode: RenderMode;
  onSelect: (objectId: string, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onDragStateChange: (dragging: boolean) => void;
  interactive: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Point3Mm | null>(null);
  const sourceObjectId = node.sourceObjectId;
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
    if (!interactive || !sourceObjectId || event.button !== 0) return;
    event.stopPropagation();
    onSelect(sourceObjectId, event.shiftKey || event.metaKey || event.ctrlKey);
    const point = groundPoint(event);
    if (!point || event.shiftKey || event.metaKey || event.ctrlKey) return;
    (event.nativeEvent.target as Element | null)?.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, startPoint: point, startPosition: node.positionMm });
    setPreview({ ...node.positionMm });
    onDragStateChange(true);
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
      position={[position.x / 1000, position.y / 1000, position.z / 1000]}
      rotation={[
        degrees(node.rotationDegrees.x),
        degrees(node.rotationDegrees.y),
        degrees(node.rotationDegrees.z),
      ]}
      onPointerDown={handlePointerDown}
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
        />
      ) : (
        <ProceduralFallbackObject
          primitives={node.primitives}
          materials={materials}
          selected={selected}
          renderMode={renderMode}
        />
      )}
      {selected || node.placeholder ? (
        <Html
          position={[0, Math.max(0.3, ...node.primitives.map((primitive) => primitive.positionMm.y / 1000)) + 0.35, 0]}
          center
          distanceFactor={7}
          className={`lr-model-object-label ${node.placeholder ? "is-placeholder" : ""}`}
        >
          {node.placeholder ? `Missing adapter · ${node.name}` : node.name}
        </Html>
      ) : null}
    </group>
  );
}
