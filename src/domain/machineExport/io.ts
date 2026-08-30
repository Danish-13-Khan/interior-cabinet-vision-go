import type { CabinetProject } from "../cabinetDimensions";
import { assertProductionExportAllowed } from "../productionOutputs";
import { createMachineJobDocument } from "./derive";
import {
  getMachineExportAdapter,
  listImplementedMachineExportAdapters,
} from "./adapters";
import type { MachineExportAdapterId, MachineJobDocument } from "./types";

export function exportMachineDocument(
  doc: MachineJobDocument,
  adapterId: MachineExportAdapterId = "json-preview",
): { adapterId: MachineExportAdapterId; contents: string; fileExtension: string; mimeType: string } {
  const adapter = getMachineExportAdapter(adapterId);
  if (!adapter || !adapter.implemented) {
    throw new Error(
      `Machine export adapter “${adapterId}” is not implemented. Available: ${listImplementedMachineExportAdapters()
        .map((item) => item.id)
        .join(", ")}`,
    );
  }

  return {
    adapterId: adapter.id,
    contents: adapter.serialize(doc),
    fileExtension: adapter.fileExtension,
    mimeType: adapter.mimeType,
  };
}

export function exportProjectMachineFile(
  project: CabinetProject,
  adapterId: MachineExportAdapterId = "json-preview",
) {
  assertProductionExportAllowed(project);
  const doc = createMachineJobDocument(project);
  return {
    document: doc,
    ...exportMachineDocument(doc, adapterId),
  };
}
