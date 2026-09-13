import type { CabinetProject } from "../cabinetDimensions";
import { createLedgerId } from "./ids";

/** Legacy collision fallback — never use as a ledger project key. */
export const FORBIDDEN_CABINET_LEDGER_FALLBACK = "cabinet-project";

export const MISSING_LEDGER_PROJECT_ID =
  "Quote frozen, but payment ledger sync refused: no stable project id.";

export type EnsureCabinetLedgerIdResult =
  | { ok: true; projectId: string; project: CabinetProject }
  | { ok: false; reason: string; project: CabinetProject };

/**
 * Resolve a stable ledger project id for cabinet freeze.
 * Prefer interiorDocument.id (same space as Interiors); else persisted
 * ledgerProjectId; else assign once. Never projectNumber; never the forbidden fallback.
 */
export function ensureCabinetLedgerProjectId(
  project: CabinetProject,
  createId: () => string = () => createLedgerId("cproj"),
): EnsureCabinetLedgerIdResult {
  const fromInterior = project.interiorDocument?.id?.trim();
  if (fromInterior && fromInterior !== FORBIDDEN_CABINET_LEDGER_FALLBACK) {
    if (project.ledgerProjectId === fromInterior) {
      return { ok: true, projectId: fromInterior, project };
    }
    return {
      ok: true,
      projectId: fromInterior,
      project: { ...project, ledgerProjectId: fromInterior },
    };
  }

  const existing = project.ledgerProjectId?.trim();
  if (existing && existing !== FORBIDDEN_CABINET_LEDGER_FALLBACK) {
    return { ok: true, projectId: existing, project };
  }

  const projectId = createId().trim();
  if (!projectId || projectId === FORBIDDEN_CABINET_LEDGER_FALLBACK) {
    return { ok: false, reason: MISSING_LEDGER_PROJECT_ID, project };
  }
  return {
    ok: true,
    projectId,
    project: { ...project, ledgerProjectId: projectId },
  };
}
