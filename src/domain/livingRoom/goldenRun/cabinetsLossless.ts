import { clampCabinetProject } from "../../cabinetDimensions";
import {
  CABINET_PLANNING_EXTENSION,
  persistCabinetIdentityOnObject,
  readPlanningExtension,
} from "../../cabinetIdentity";
import { cabinetFromObject } from "../../interiorProject/cabinetAdapterCabinets";
import type { InteriorObjectEntity } from "../../interiorProject";
import { GOLDEN_RUN_FILLER_IDS, GOLDEN_RUN_OBJECT_IDS } from "./types";

const GOLDEN_IDS = new Set<string>([
  ...Object.values(GOLDEN_RUN_OBJECT_IDS),
  ...Object.values(GOLDEN_RUN_FILLER_IDS),
]);
const WALL_IDS = new Set<string>([GOLDEN_RUN_OBJECT_IDS.wallA, GOLDEN_RUN_OBJECT_IDS.wallB]);

function withAttachment(
  object: InteriorObjectEntity,
  attachment: "floor" | "right-wall",
): InteriorObjectEntity {
  const planning = readPlanningExtension(object.extensions);
  return persistCabinetIdentityOnObject({
    ...object,
    extensions: {
      ...object.extensions,
      [CABINET_PLANNING_EXTENSION]: { ...planning, attachment },
    },
  });
}

/** Stamp the same clamped pose Engineering will use, so handoff is lossless. */
export function finalizeGoldenRunCabinet(object: InteriorObjectEntity): InteriorObjectEntity {
  if (!GOLDEN_IDS.has(object.id)) return object;
  const prepared = withAttachment(object, WALL_IDS.has(object.id) ? "right-wall" : "floor");
  const cabinet = cabinetFromObject(prepared);
  if (!cabinet) return prepared;
  const clamped = clampCabinetProject({ version: 1, cabinets: [cabinet] }).cabinets[0]!;
  return persistCabinetIdentityOnObject({
    ...prepared,
    position: {
      x: clamped.placement.x,
      y: clamped.placement.y,
      z: clamped.placement.z,
    },
    rotation: { ...prepared.rotation, y: clamped.placement.rotation },
    dimensions: {
      widthMm: clamped.config.dimensions.width,
      heightMm: clamped.config.dimensions.height,
      depthMm: clamped.config.dimensions.depth,
    },
    extensions: {
      ...prepared.extensions,
      [CABINET_PLANNING_EXTENSION]: {
        ...readPlanningExtension(prepared.extensions),
        attachment: clamped.placement.attachment,
        config: clamped.config,
      },
    },
  });
}

export function finalizeGoldenRunObjects(objects: InteriorObjectEntity[]) {
  return objects.map(finalizeGoldenRunCabinet);
}
