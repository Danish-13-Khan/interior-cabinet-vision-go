import type { CabinetProject } from "../cabinetDimensions";
import type { InteriorProject } from "../interiorProject/types";
import {
  diagnoseCabinetProject,
  diagnoseInteriorCabinets,
  diagnoseUnrepresentedInteriorCabinets,
  mergeDiagnosticReports,
} from "./diagnose";
import type { AdapterDiagnosticReport } from "./types";

export function diagnoseProjectIdentity(
  project: CabinetProject,
): AdapterDiagnosticReport {
  const fromCabinets = diagnoseCabinetProject(project);
  if (!project.interiorDocument) return fromCabinets;
  return mergeDiagnosticReports(
    fromCabinets,
    diagnoseUnrepresentedInteriorCabinets(project.interiorDocument),
  );
}

export function diagnoseDocumentIdentity(document: InteriorProject): AdapterDiagnosticReport {
  return diagnoseInteriorCabinets(document);
}

export function productionIdentityBlocked(project: CabinetProject): boolean {
  return diagnoseProjectIdentity(project).blocking;
}
