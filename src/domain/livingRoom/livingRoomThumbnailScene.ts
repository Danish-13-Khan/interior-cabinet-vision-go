import { createLivingRoomObject, type LivingRoomCatalogId } from "./catalog";
import { createLivingRoomStarterProject } from "./preset";
import { compileLivingRoomScene } from "./sceneCompiler";
import { sceneNodeAabbMm, unionAabbMm, type AabbMm } from "./sceneNodeBounds";
import type { CompiledLivingRoomScene } from "./sceneTypes";

const THUMB_OBJECT_ID = "catalog-thumbnail-object";

/** One catalogue item compiled on its own through the product scene compiler. */
export function livingRoomThumbnailScene(itemId: string): {
  nodes: CompiledLivingRoomScene["nodes"];
  materials: CompiledLivingRoomScene["materials"];
  box: AabbMm;
} | null {
  const starter = createLivingRoomStarterProject({ now: "2026-01-01T00:00:00.000Z" });
  const object = createLivingRoomObject(itemId as LivingRoomCatalogId, {
    id: THUMB_OBJECT_ID,
    roomId: starter.activeRoomId,
    position: { x: 0, y: 0, z: 0 },
  });
  const scene = compileLivingRoomScene({ ...starter, objects: [object] });
  const nodes = scene.nodes.filter((node) => node.sourceObjectId === THUMB_OBJECT_ID);
  const box = unionAabbMm(nodes.map(sceneNodeAabbMm).filter((value): value is AabbMm => Boolean(value)));
  if (!box) return null;
  return { nodes, materials: scene.materials, box };
}
