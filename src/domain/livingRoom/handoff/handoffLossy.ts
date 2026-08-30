import {
  isGoldenCabinetFamilyId,
  readCabinetIdentity,
} from "../../cabinetIdentity";
import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import {
  adaptHandoffProject,
  cabinetForInteriorObject,
  expectedCabinetId,
} from "./handoffCabinets";
import { compareAdaptedCabinet } from "./handoffConfigCompare";
import type { HandoffWarning } from "./types";

function warning(
  partial: Omit<HandoffWarning, "blocking"> & { blocking?: boolean },
): HandoffWarning {
  return { ...partial, blocking: partial.blocking ?? partial.severity === "error" };
}

function rotationLoss(object: InteriorObjectEntity): HandoffWarning | null {
  const snapped = Math.round(object.rotation.y / 90) * 90;
  if (Math.abs(object.rotation.y - snapped) <= 0.5) return null;
  const golden = isGoldenCabinetFamilyId(readCabinetIdentity(object)?.familyId ?? "");
  return warning({
    code: "unsupported-rotation",
    severity: golden ? "error" : "warning",
    path: `objects.${object.id}.rotation`,
    message: "Placement rotation is not a supported 90-degree increment.",
    objectId: object.id,
    blocking: golden,
  });
}

function goldenFieldLoss(
  object: InteriorObjectEntity,
  cabinet: NonNullable<ReturnType<typeof cabinetForInteriorObject>>,
): HandoffWarning[] {
  const identity = readCabinetIdentity(object);
  if (!identity || !isGoldenCabinetFamilyId(identity.familyId)) return [];
  const notes: HandoffWarning[] = [];
  if (cabinet.id !== expectedCabinetId(object)) {
    notes.push(warning({
      code: "recreated-cabinet",
      severity: "error",
      path: `objects.${object.id}`,
      message: "Golden cabinet would be recreated with a new engineering ID.",
      objectId: object.id,
    }));
  }
  if (identity.familyResolvedFromType) {
    notes.push(warning({
      code: "family-resolved-from-type",
      severity: "error",
      path: `objects.${object.id}.familyId`,
      message: "Golden cabinet family was inferred instead of stored.",
      objectId: object.id,
    }));
  }
  notes.push(...compareAdaptedCabinet(object, cabinet));
  return notes;
}

export function diagnoseHandoffLoss(document: InteriorProject): HandoffWarning[] {
  const adapted = adaptHandoffProject(document);
  const notes: HandoffWarning[] = adapted.diagnostics.map((item) => ({
    code: item.code,
    severity: item.severity,
    path: item.path,
    message: item.message,
    objectId: item.objectId,
    blocking: item.blocking,
  }));
  for (const object of document.objects.filter((item) => item.kind === "cabinet")) {
    const identity = readCabinetIdentity(object);
    const golden = Boolean(identity && isGoldenCabinetFamilyId(identity.familyId));
    const cabinet = cabinetForInteriorObject(adapted.project, object);
    const rotation = rotationLoss(object);
    if (rotation) notes.push(rotation);
    if (!cabinet) {
      if (golden) {
        notes.push(warning({
          code: "recreated-cabinet",
          severity: "error",
          path: `objects.${object.id}`,
          message: "Golden cabinet was not mapped and would be recreated.",
          objectId: object.id,
        }));
      }
      continue;
    }
    notes.push(...goldenFieldLoss(object, cabinet));
  }
  return notes;
}

export function lossyGoldenObjectIds(document: InteriorProject): string[] {
  return [...new Set(
    diagnoseHandoffLoss(document)
      .filter((note) => note.blocking && note.objectId)
      .map((note) => note.objectId!),
  )].filter((objectId) => {
    const object = document.objects.find((item) => item.id === objectId);
    const familyId = object ? readCabinetIdentity(object)?.familyId : undefined;
    return Boolean(familyId && isGoldenCabinetFamilyId(familyId));
  });
}
