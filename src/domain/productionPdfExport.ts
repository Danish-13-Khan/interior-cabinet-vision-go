import type { CabinetProject } from "./cabinetDimensions";
import {
  ProductionIdentityBlockedError,
  resolveExportableProjectCutlist,
} from "./productionOutputs";

export type ProductionPdfExportIo = {
  promptPath: () => Promise<string | null>;
  writePdf: (path: string, blob: Blob) => Promise<void>;
  generatePdf: () => Promise<Blob>;
};

export type ProductionPdfExportResult = {
  prompted: boolean;
  wrote: boolean;
  status: string;
};

function blockedPdfStatus(project: CabinetProject): string | null {
  const result = resolveExportableProjectCutlist(project);
  if (!result.blocked) return null;
  return new ProductionIdentityBlockedError(result.diagnostics).message;
}

export async function runGatedProductionPdfExport(
  project: CabinetProject,
  io: ProductionPdfExportIo,
  cancelledStatus: string,
  successStatus: string,
): Promise<ProductionPdfExportResult> {
  const blocked = blockedPdfStatus(project);
  if (blocked) {
    return { prompted: false, wrote: false, status: blocked };
  }
  const path = await io.promptPath();
  if (!path) {
    return { prompted: true, wrote: false, status: cancelledStatus };
  }
  await io.writePdf(path, await io.generatePdf());
  return { prompted: true, wrote: true, status: successStatus };
}

/** Cabinets workspace Production Packet PDF. */
export function runCabinetsPdfExport(
  project: CabinetProject,
  io: ProductionPdfExportIo,
  successStatus = "PDF report saved.",
): Promise<ProductionPdfExportResult> {
  return runGatedProductionPdfExport(
    project,
    io,
    "PDF export cancelled.",
    successStatus,
  );
}

/** Interiors workshop Production Packet PDF. */
export function runInteriorsProductionPdfExport(
  project: CabinetProject,
  io: ProductionPdfExportIo,
  successStatus: string,
): Promise<ProductionPdfExportResult> {
  return runGatedProductionPdfExport(
    project,
    io,
    "Production packet export cancelled.",
    successStatus,
  );
}
