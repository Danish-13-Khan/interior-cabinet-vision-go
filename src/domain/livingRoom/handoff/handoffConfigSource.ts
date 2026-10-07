import type { CabinetConfig } from "../../cabinetDimensions";
import { readCabinetIdentity, readPlanningExtension } from "../../cabinetIdentity";
import type { InteriorObjectEntity } from "../../interiorProject";
import { applyCabinetObjectParameters } from "../../interiorProject/cabinetObjectParameters";

export type HandoffAuthoredSource = {
  objectId: string;
  dimensions: { width: number; height: number; depth: number };
  position: { x: number; y: number; z: number };
  attachment?: string;
  type?: string;
  familyId?: string;
  planningDimensions?: { width?: number; height?: number; depth?: number };
  composition?: unknown;
  construction?: unknown;
  hardware?: unknown;
  buildRules?: unknown;
  materialSlots: Record<string, string>;
};

function asConfig(value: unknown): CabinetConfig | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CabinetConfig)
    : null;
}

function authoredSlots(slots: InteriorObjectEntity["materialSlots"]) {
  return Object.fromEntries(
    Object.entries(slots ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1]),
    ),
  );
}

export function readHandoffAuthoredSource(
  object: InteriorObjectEntity,
): HandoffAuthoredSource {
  const identity = readCabinetIdentity(object);
  const planning = readPlanningExtension(object.extensions);
  const stored = asConfig(planning?.config);
  // Front system, door style and hosted-appliance inserts are authored as object
  // parameters; the adapter folds them into the config, so the authored side must too
  // or every gola kitchen reads as "construction changed".
  const config = stored ? applyCabinetObjectParameters(stored, object.parameters) : null;
  const attachment = typeof planning?.attachment === "string" ? planning.attachment : undefined;
  return {
    objectId: object.id,
    dimensions: {
      width: object.dimensions.widthMm,
      height: object.dimensions.heightMm,
      depth: object.dimensions.depthMm,
    },
    position: { ...object.position },
    attachment,
    type: identity?.cabinetType ?? config?.type,
    familyId: identity?.familyId ?? config?.familyId,
    planningDimensions: stored?.dimensions,
    composition: config?.composition,
    construction: config?.construction,
    hardware: config?.hardware,
    buildRules: config?.buildRules,
    materialSlots: authoredSlots(object.materialSlots),
  };
}
