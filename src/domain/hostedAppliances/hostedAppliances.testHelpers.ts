import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { createGoldenCabinetRunProject } from "../livingRoom/goldenRun/createProject";

export const SINK_ID = "test-sink";

export function sinkObject(roomId: string, overrides: Partial<InteriorObjectEntity> = {}): InteriorObjectEntity {
  return {
    id: SINK_ID, roomId, kind: "furniture", category: "kitchen-and-appliances",
    catalogItemId: "imported-sink", name: "Undermount sink", position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }, dimensions: { widthMm: 760, heightMm: 200, depthMm: 480 },
    materialSlots: {}, parameters: {}, ...overrides,
  };
}

export function withSink(): InteriorProject {
  const project = createGoldenCabinetRunProject();
  return { ...project, objects: [...project.objects, sinkObject(project.activeRoomId!)] };
}

export const findObject = (project: InteriorProject, id: string) => project.objects.find((object) => object.id === id)!;

export const mapObject = (project: InteriorProject, id: string, update: (object: InteriorObjectEntity) => InteriorObjectEntity) =>
  ({ ...project, objects: project.objects.map((object) => (object.id === id ? update(object) : object)) });
