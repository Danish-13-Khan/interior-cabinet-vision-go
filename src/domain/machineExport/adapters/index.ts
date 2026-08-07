import type { MachineExportAdapter, MachineExportAdapterId } from "../types";
import { csvOpsPreviewAdapter } from "./csvOpsPreview";
import { jsonPreviewAdapter } from "./jsonPreview";

/**
 * Registry for machine export adapters.
 * Future formats (DXF, G-code, vendor packs) should register here only when implemented.
 */
export const MACHINE_EXPORT_ADAPTERS: MachineExportAdapter[] = [
  jsonPreviewAdapter,
  csvOpsPreviewAdapter,
];

export function getMachineExportAdapter(
  id: MachineExportAdapterId,
): MachineExportAdapter | null {
  return MACHINE_EXPORT_ADAPTERS.find((adapter) => adapter.id === id) ?? null;
}

export function listImplementedMachineExportAdapters(): MachineExportAdapter[] {
  return MACHINE_EXPORT_ADAPTERS.filter((adapter) => adapter.implemented);
}
