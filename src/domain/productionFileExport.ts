import type { CabinetProject } from "./cabinetDimensions";
import { csvFromProductionCutlist } from "./productionCutlist";
import { exportProjectMachineFile } from "./machineExport";
import type { MachineExportAdapterId } from "./machineExport";
import {
  ProductionIdentityBlockedError,
  resolveExportableProjectCutlist,
} from "./productionOutputs";

export type PreparedProductionExport =
  | { ok: true; contents: string }
  | { ok: false; wrote: false; status: string };

export function prepareCutlistCsvExport(
  project: CabinetProject,
): PreparedProductionExport {
  const result = resolveExportableProjectCutlist(project);
  if (result.blocked) {
    return {
      ok: false,
      wrote: false,
      status: new ProductionIdentityBlockedError(result.diagnostics).message,
    };
  }
  return { ok: true, contents: csvFromProductionCutlist(result.lines) };
}

export function prepareMachineFileExport(
  project: CabinetProject,
  adapterId: MachineExportAdapterId,
): PreparedProductionExport {
  const result = resolveExportableProjectCutlist(project);
  if (result.blocked) {
    return {
      ok: false,
      wrote: false,
      status: new ProductionIdentityBlockedError(result.diagnostics).message,
    };
  }
  return { ok: true, contents: exportProjectMachineFile(project, adapterId).contents };
}

/** Testable write gate: blocked exports never invoke `write`. */
export function commitPreparedExport(
  prepared: PreparedProductionExport,
  write: (contents: string) => void,
  successStatus: string,
): { wrote: boolean; status: string } {
  if (!prepared.ok) {
    return { wrote: false, status: prepared.status };
  }
  write(prepared.contents);
  return { wrote: true, status: successStatus };
}
