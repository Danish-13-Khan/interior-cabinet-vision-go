import type { MachineExportAdapter, MachineJobDocument } from "../types";

/** Flattened operations CSV — still preview/intent only. */
export const csvOpsPreviewAdapter: MachineExportAdapter = {
  id: "csv-ops-preview",
  label: "Operations CSV (preview)",
  description:
    "One row per machining intent operation. Coordinates are incomplete by design.",
  mimeType: "text/csv",
  fileExtension: "csv",
  implemented: true,
  serialize(doc: MachineJobDocument) {
    const header = [
      "shopRef",
      "cabinet",
      "part",
      "category",
      "opKind",
      "opLabel",
      "status",
      "description",
      "lengthMm",
      "widthMm",
      "thicknessMm",
      "depthMm",
      "diameterMm",
      "grainAlong",
      "faceUp",
    ].join(",");

    const rows = doc.parts.flatMap((part) =>
      part.operations.map((op) =>
        [
          part.shopRef,
          csv(part.cabinetName),
          csv(part.label),
          part.category,
          op.kind,
          csv(op.label),
          op.status,
          csv(op.description),
          part.blank.lengthMm,
          part.blank.widthMm,
          part.blank.thicknessMm,
          op.geometry?.depthMm ?? "",
          op.geometry?.diameterMm ?? "",
          part.orientation.grainAlong,
          part.orientation.faceUp,
        ].join(","),
      ),
    );

    return [header, ...rows].join("\n");
  },
};

function csv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
