import {
  createEmptyInteriorProject,
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";
import { createRectangularRoomShell } from "../interiorFoundation";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "../livingRoom/materials";
import type { ApartmentTemplateSpec } from "./types";

/** Outer rectangle + wall graph for guillotine splits. */
export function buildOuterRectangle(
  spec: ApartmentTemplateSpec,
  idFactory: LivingRoomIdFactory,
  now: string,
): { project: InteriorProject; rootRoomId: string } {
  const rootRoomId = idFactory("room", "root");
  const shell = createRectangularRoomShell({
    roomId: rootRoomId,
    dimensions: {
      widthMm: spec.shell.widthMm,
      depthMm: spec.shell.depthMm,
      heightMm: spec.shell.heightMm,
      wallThicknessMm: spec.shell.externalWallMm,
    },
    wallMaterialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    openings: [],
    idFactory,
  });
  const base = createEmptyInteriorProject({
    id: idFactory("project", "doc"),
    name: spec.name,
    now,
  });
  const draft: InteriorProject = {
    ...base,
    activeRoomId: rootRoomId,
    rooms: [
      {
        id: rootRoomId,
        name: "Root",
        roomType: "custom",
        dimensions: {
          widthMm: spec.shell.widthMm,
          heightMm: spec.shell.heightMm,
          depthMm: spec.shell.depthMm,
        },
        wallThicknessMm: spec.shell.externalWallMm,
        extensions: {
          floorMaterialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
          ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
          apartmentCell: "root",
        },
      },
    ],
    walls: shell.walls.map((wall) => ({ ...wall, raised: true })),
    openings: [],
    materials: createLivingRoomMaterials(),
    extensions: {
      ...base.extensions,
      apartmentTemplateId: spec.id,
    },
  };
  const validated = validateInteriorProject(draft);
  return { project: validated.project, rootRoomId };
}
