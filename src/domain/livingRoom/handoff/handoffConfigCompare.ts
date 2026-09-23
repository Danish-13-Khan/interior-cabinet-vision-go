import {
  clampCabinetPlacement,
  type CabinetInstance,
  type CabinetPlacement,
} from "../../cabinetDimensions";
import { applyWallMountPlacementFix } from "../../manufacturingRules/fixes";
import type { InteriorObjectEntity } from "../../interiorProject";
import { stableStringify } from "../sceneCompilerBounds";
import { readHandoffAuthoredSource } from "./handoffConfigSource";
import type { HandoffWarning } from "./types";

function warning(
  partial: Omit<HandoffWarning, "blocking"> & { blocking?: boolean },
): HandoffWarning {
  return { ...partial, blocking: partial.blocking ?? partial.severity === "error" };
}

function fieldNote(objectId: string, field: string, message: string): HandoffWarning {
  return warning({
    code: "lossy-field",
    severity: "error",
    path: `objects.${objectId}.${field}`,
    message,
    objectId,
  });
}

function sameValue(left: unknown, right: unknown) {
  return stableStringify(withoutUndefined(left)) === stableStringify(withoutUndefined(right));
}

/** JSON persistence drops undefined object fields; they are not authored handoff data. */
function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : withoutUndefined(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, withoutUndefined(item)]),
    );
  }
  return value;
}

function compareAuthored(
  objectId: string,
  field: string,
  label: string,
  left: unknown,
  right: unknown,
): HandoffWarning[] {
  if (left == null) return [];
  if (sameValue(left, right ?? null)) return [];
  return [fieldNote(objectId, field, `Golden cabinet ${label} changed during handoff.`)];
}

function compareObjectDims(
  objectId: string,
  source: ReturnType<typeof readHandoffAuthoredSource>,
  adapted: CabinetInstance,
): HandoffWarning[] {
  const notes: HandoffWarning[] = [];
  (["width", "height", "depth"] as const).forEach((axis) => {
    if (source.dimensions[axis] !== adapted.config.dimensions[axis]) {
      notes.push(fieldNote(
        objectId,
        `dimensions.${axis}`,
        `Golden cabinet ${axis} ${source.dimensions[axis]} became ${adapted.config.dimensions[axis]} during handoff.`,
      ));
    }
    const planned = source.planningDimensions?.[axis];
    if (typeof planned === "number" && planned !== adapted.config.dimensions[axis]) {
      notes.push(fieldNote(
        objectId,
        `planning.dimensions.${axis}`,
        `Golden planning ${axis} ${planned} was dropped; Engineering has ${adapted.config.dimensions[axis]}.`,
      ));
    }
  });
  return notes;
}

/** Placement the engineering adapter writes from this authored position, including its shop snap. */
function engineeringPlacement(
  source: ReturnType<typeof readHandoffAuthoredSource>,
  adapted: CabinetInstance,
): CabinetPlacement {
  const attachment = source.attachment === "back-wall"
    || source.attachment === "left-wall"
    || source.attachment === "right-wall"
    ? source.attachment
    : "floor";
  const mounted = applyWallMountPlacementFix(adapted.config.type, {
    x: source.position.x,
    y: source.position.y,
    z: source.position.z,
    rotation: adapted.placement.rotation,
    attachment,
  }).placement;
  return clampCabinetPlacement(mounted, adapted.config.dimensions);
}

function comparePlacement(
  objectId: string,
  source: ReturnType<typeof readHandoffAuthoredSource>,
  adapted: CabinetInstance,
): HandoffWarning[] {
  const notes: HandoffWarning[] = [];
  const expected = engineeringPlacement(source, adapted);
  if (
    expected.x !== adapted.placement.x
    || expected.y !== adapted.placement.y
    || expected.z !== adapted.placement.z
  ) {
    notes.push(fieldNote(
      objectId,
      "placement",
      "Golden cabinet placement changed during handoff.",
    ));
  }
  if (source.attachment && source.attachment !== adapted.placement.attachment) {
    notes.push(fieldNote(
      objectId,
      "placement.attachment",
      `Golden cabinet attachment ${source.attachment} became ${adapted.placement.attachment} during handoff.`,
    ));
  }
  return notes;
}

function compareMaterialSlots(
  objectId: string,
  slots: Record<string, string>,
): HandoffWarning[] {
  const keys = Object.keys(slots);
  if (!keys.length) return [];
  return [fieldNote(
    objectId,
    "materialSlots",
    `Golden cabinet material roles (${keys.join(", ")}) were dropped during handoff.`,
  )];
}

export function compareAdaptedCabinet(
  object: InteriorObjectEntity,
  adapted: CabinetInstance,
): HandoffWarning[] {
  const source = readHandoffAuthoredSource(object);
  return [
    ...compareObjectDims(object.id, source, adapted),
    ...comparePlacement(object.id, source, adapted),
    ...compareAuthored(object.id, "type", "type", source.type, adapted.config.type),
    ...compareAuthored(object.id, "familyId", "family", source.familyId, adapted.config.familyId ?? ""),
    ...compareAuthored(object.id, "composition", "composition", source.composition, adapted.config.composition),
    ...compareAuthored(object.id, "construction", "construction", source.construction, adapted.config.construction),
    ...compareAuthored(object.id, "hardware", "hardware", source.hardware, adapted.config.hardware),
    ...compareAuthored(object.id, "buildRules", "material roles", source.buildRules, adapted.config.buildRules ?? {}),
    ...compareMaterialSlots(object.id, source.materialSlots),
  ];
}
