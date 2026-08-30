import { parseCabinetType } from "./parseType";
import { familyType, isCabinetFamilyId } from "./families";
import { listCurrentProjectCabinets } from "./currentCabinets";
import { readCabinetIdentity } from "./read";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject/types";
import type { CabinetProject } from "../cabinetDimensions";
import type { AdapterDiagnostic, AdapterDiagnosticReport } from "./types";

function diagnostic(
  partial: Omit<AdapterDiagnostic, "blocking"> & { blocking?: boolean },
): AdapterDiagnostic {
  const blocking = partial.blocking ?? partial.severity === "error";
  return { ...partial, blocking };
}

function diagnoseObject(object: InteriorObjectEntity): AdapterDiagnostic[] {
  if (object.kind !== "cabinet") return [];
  const path = `objects.${object.id}`;
  const identity = readCabinetIdentity(object);
  const categoryType = parseCabinetType(object.category);
  if (!identity) {
    const notes: AdapterDiagnostic[] = [
      diagnostic({
        severity: "warning",
        code: "skipped-unidentified-cabinet",
        path,
        message: "Cabinet has no explicit type or family and will not enter production.",
        objectId: object.id,
        blocking: false,
      }),
    ];
    if (categoryType) {
      notes.push(diagnostic({
        severity: "error",
        code: "category-is-not-type",
        path: `${path}.category`,
        message: "Display category is not a cabinet type and must not be used as one.",
        objectId: object.id,
        blocking: true,
      }));
    }
    if (object.category === "storage") {
      notes.push(diagnostic({
        severity: "error",
        code: "silent-fallback-blocked",
        path,
        message: "Generic storage category must not fall back to a base cabinet.",
        objectId: object.id,
        blocking: true,
      }));
    }
    return notes;
  }
  const issues: AdapterDiagnostic[] = [];
  if (!isCabinetFamilyId(identity.familyId)) {
    issues.push(diagnostic({
      severity: "error",
      code: "unknown-family",
      path: `${path}.familyId`,
      message: `Cabinet family ${identity.familyId} is unknown.`,
      objectId: object.id,
    }));
  } else if (familyType(identity.familyId) !== identity.cabinetType) {
    issues.push(diagnostic({
      severity: "error",
      code: "family-type-mismatch",
      path: `${path}.familyId`,
      message: `Family ${identity.familyId} does not match type ${identity.cabinetType}.`,
      objectId: object.id,
    }));
  }
  if (identity.familyResolvedFromType) {
    issues.push(diagnostic({
      severity: "warning",
      code: "family-resolved-from-type",
      path: `${path}.familyId`,
      message: "Family was completed from cabinet type because none was stored.",
      objectId: object.id,
      blocking: false,
    }));
  }
  return issues;
}

export function diagnoseInteriorCabinets(project: InteriorProject): AdapterDiagnosticReport {
  const diagnostics = project.objects.flatMap(diagnoseObject);
  return { diagnostics, blocking: diagnostics.some((item) => item.blocking) };
}

/** Document objects the adapter could not represent — not current Cabinet edits. */
export function diagnoseUnrepresentedInteriorCabinets(
  document: InteriorProject,
): AdapterDiagnosticReport {
  const diagnostics = document.objects
    .filter((object) => object.kind === "cabinet" && !readCabinetIdentity(object))
    .flatMap(diagnoseObject);
  return { diagnostics, blocking: diagnostics.some((item) => item.blocking) };
}

export function diagnoseCabinetProject(project: CabinetProject): AdapterDiagnosticReport {
  const diagnostics = listCurrentProjectCabinets(project).flatMap((cabinet) => {
    const familyId = cabinet.config.familyId;
    const path = `cabinets.${cabinet.id}.config.familyId`;
    if (!familyId) {
      return [diagnostic({
        severity: "warning",
        code: "family-resolved-from-type",
        path,
        message: "Family was completed from cabinet type because none was stored.",
        objectId: cabinet.id,
        blocking: false,
      })];
    }
    if (!isCabinetFamilyId(familyId)) {
      return [diagnostic({
        severity: "error",
        code: "unknown-family",
        path,
        message: `Cabinet family ${familyId} is unknown.`,
        objectId: cabinet.id,
      })];
    }
    if (familyId && isCabinetFamilyId(familyId) && familyType(familyId) !== cabinet.config.type) {
      return [diagnostic({
        severity: "error",
        code: "family-type-mismatch",
        path,
        message: `Family ${familyId} does not match type ${cabinet.config.type}.`,
        objectId: cabinet.id,
      })];
    }
    return [];
  });
  return { diagnostics, blocking: diagnostics.some((item) => item.blocking) };
}

export function mergeDiagnosticReports(
  ...reports: AdapterDiagnosticReport[]
): AdapterDiagnosticReport {
  const diagnostics = reports.flatMap((report) => report.diagnostics);
  return { diagnostics, blocking: diagnostics.some((item) => item.blocking) };
}

export function isProductionBlocked(report: AdapterDiagnosticReport): boolean {
  return report.blocking;
}
