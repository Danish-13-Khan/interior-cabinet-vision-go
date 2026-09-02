type InteriorsCanvasView = "plan" | "model" | "render";

/** Customer-facing labels for leftover technical export commands. */
export const INTERIORS_CUSTOMER_EXPORTS = {
  jobFile: { label: "Download job file", hint: "Save a JSON copy of this job" },
  cutlist: { label: "Download cutlist", hint: "Board parts for the shop" },
  shopPacket: { label: "Download shop packet", hint: "Printable production packet" },
  machinePreview: { label: "Download machine preview", hint: "Machining intent — not a CNC program" },
  snapshotRevision: { label: "Snapshot this revision", hint: "Record the current revision fingerprint" },
  releaseToShop: { label: "Release to shop", hint: "Mark the approved revision released for the shop" },
  revisionSummary: { label: "Download revision summary", hint: "Printable approval and change log" },
} as const;

export function interiorsStageTitle(view: InteriorsCanvasView): string {
  if (view === "model") return "3D model";
  if (view === "render") return "Client view";
  return "2D plan";
}

export function interiorsShowsProductionChrome(): boolean {
  return false;
}

export function interiorsShowsEmptyInspector(hasSelection: boolean): boolean {
  return hasSelection;
}

export type InteriorsQaFixture = "openReleaseDemo" | "openGoldenRun" | "openRenderStudio";

export function isInteriorsQaFixture(value: unknown): value is InteriorsQaFixture {
  return value === "openReleaseDemo" || value === "openGoldenRun" || value === "openRenderStudio";
}
