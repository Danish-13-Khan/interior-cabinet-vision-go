import type { InteriorProject } from "../interiorProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import type { CompiledLivingRoomScene } from "./sceneTypes";

/** Compiled scene for a room of one project revision (null: the project's active room). */
export type RoomSceneLookup = (roomId: string | null | undefined) => CompiledLivingRoomScene;

/**
 * Scenes compiled per room for one document revision, on first use. Revisiting
 * a room (the Showcase tour) returns the same scene object, so Model View never
 * regenerates geometry it already built. Make a new cache per project revision.
 */
export function createRoomSceneCache(project: InteriorProject): RoomSceneLookup {
  const scenes = new Map<string, CompiledLivingRoomScene>();
  return (roomId) => {
    const key = roomId ?? project.activeRoomId ?? "";
    let scene = scenes.get(key);
    if (!scene) {
      const viewProject = key === (project.activeRoomId ?? "") ? project : { ...project, activeRoomId: key };
      scene = compileLivingRoomScene(viewProject);
      scenes.set(key, scene);
    }
    return scene;
  };
}
