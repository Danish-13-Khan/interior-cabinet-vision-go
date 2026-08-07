import type { MachineExportAdapter, MachineJobDocument } from "../types";

export const jsonPreviewAdapter: MachineExportAdapter = {
  id: "json-preview",
  label: "Machine JSON (preview)",
  description:
    "Exports machining intent metadata for future adapters. Not a CNC program.",
  mimeType: "application/json",
  fileExtension: "json",
  implemented: true,
  serialize(doc: MachineJobDocument) {
    return JSON.stringify(doc, null, 2);
  },
};
