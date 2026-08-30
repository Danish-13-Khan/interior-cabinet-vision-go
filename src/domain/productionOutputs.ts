import type { CabinetInstance, CabinetProject } from "./cabinetDimensions";
import {
  diagnoseProjectIdentity,
  type AdapterDiagnostic,
} from "./cabinetIdentity";
import {
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
  type ProductionCutlistLine,
} from "./productionCutlist";

export type ExportableCutlistResult =
  | { blocked: false; lines: ProductionCutlistLine[] }
  | { blocked: true; lines: []; diagnostics: AdapterDiagnostic[] };

export class ProductionIdentityBlockedError extends Error {
  readonly diagnostics: AdapterDiagnostic[];

  constructor(diagnostics: AdapterDiagnostic[]) {
    const first = diagnostics.find((item) => item.blocking);
    super(
      first
        ? `Production export blocked: ${first.message}`
        : "Production export blocked by cabinet identity diagnostics.",
    );
    this.name = "ProductionIdentityBlockedError";
    this.diagnostics = diagnostics;
  }
}

export function resolveExportableProjectCutlist(
  project: CabinetProject,
): ExportableCutlistResult {
  const identity = diagnoseProjectIdentity(project);
  if (identity.blocking) {
    return { blocked: true, lines: [], diagnostics: identity.diagnostics };
  }
  return { blocked: false, lines: createProjectProductionCutlist(project) };
}

export function createExportableProjectCutlist(
  project: CabinetProject,
): ProductionCutlistLine[] {
  return resolveExportableProjectCutlist(project).lines;
}

export function createExportableCabinetCutlist(
  project: CabinetProject,
  cabinet: CabinetInstance,
  cabinetIndex = 1,
): ProductionCutlistLine[] {
  return resolveExportableProjectCutlist(project).blocked
    ? []
    : createCabinetProductionCutlist(cabinet, cabinetIndex);
}

export function createExportableCabinetCutlistMap(
  project: CabinetProject,
): Map<string, ProductionCutlistLine[]> {
  return new Map(
    project.cabinets.map((cabinet, index) => [
      cabinet.id,
      createExportableCabinetCutlist(project, cabinet, index + 1),
    ]),
  );
}

export function assertProductionExportAllowed(project: CabinetProject): void {
  const result = resolveExportableProjectCutlist(project);
  if (result.blocked) {
    throw new ProductionIdentityBlockedError(result.diagnostics);
  }
}
