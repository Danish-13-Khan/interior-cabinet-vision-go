import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import {
  LIVING_ROOM_THUMBNAIL_SIZE,
  livingRoomThumbnailPose,
} from "../../domain/livingRoom/livingRoomThumbnails";
import { livingRoomThumbnailScene } from "../../domain/livingRoom/livingRoomThumbnailScene";
import { CompiledNodeView } from "../livingRoomScene/CompiledNodeView";
import { RendererColorPipeline } from "../livingRoomScene/RendererColorPipeline";
import { StudioEnvironment } from "../livingRoomScene/StudioEnvironment";

const STAGE_COLOR = "#f3f4f1";
const noop = () => undefined;

function PoseCamera({ pose, onReady }: {
  pose: ReturnType<typeof livingRoomThumbnailPose>;
  onReady: () => void;
}) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const frames = useRef(0);
  useEffect(() => {
    camera.position.set(pose.position.x / 1000, pose.position.y / 1000, pose.position.z / 1000);
    camera.fov = pose.fieldOfViewDegrees;
    camera.near = 0.02;
    camera.far = 50;
    camera.lookAt(pose.target.x / 1000, pose.target.y / 1000, pose.target.z / 1000);
    camera.updateProjectionMatrix();
  }, [camera, pose]);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 12) onReady();
  });
  return null;
}

/** Renders one catalogue item through the product node renderer for thumbnails. */
export function CatalogThumbnailStage({ itemId, onReady }: { itemId: string; onReady: () => void }) {
  const built = useMemo(() => livingRoomThumbnailScene(itemId), [itemId]);
  const materials = useMemo(
    () => new Map((built?.materials ?? []).map((material) => [material.id, material])),
    [built],
  );
  if (!built) return <p role="alert">Unknown catalogue item {itemId}</p>;
  const pose = livingRoomThumbnailPose(built.box);
  return (
    <div
      className="catalog-thumbnail-stage"
      style={{ width: LIVING_ROOM_THUMBNAIL_SIZE.widthPx, height: LIVING_ROOM_THUMBNAIL_SIZE.heightPx }}
    >
      <Canvas shadows="percentage" dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={[STAGE_COLOR]} />
        <RendererColorPipeline exposure={1} />
        <StudioEnvironment />
        <hemisphereLight args={["#ffffff", "#d9d4ca", 0.6]} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow />
        <directionalLight position={[-4, 2, 3]} intensity={0.45} />
        {built.nodes.map((node) => (
          <CompiledNodeView
            key={node.id}
            node={node}
            materials={materials}
            selected={false}
            snapSizeMm={50}
            renderMode="preview"
            showSelectedLabel={false}
            interactive={false}
            onSelect={noop}
            onSelectOpening={noop}
            onSelectWall={noop}
            onClearSelection={noop}
            onMove={noop}
            onDragStateChange={noop}
          />
        ))}
        <PoseCamera pose={pose} onReady={onReady} />
      </Canvas>
    </div>
  );
}
