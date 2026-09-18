export type PlanImportKind = "underlay-pdf" | "underlay-image" | "import-walls" | "unsupported";

export const PLAN_UNDERLAY_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,.pdf";

export const IMPORT_WALLS_ACCEPT = ".dxf,.DXF,.svg,image/svg+xml";

function isPdfNameOrType(file: Pick<File, "name" | "type">): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf" || type === "application/x-pdf") return true;
  return /\.pdf$/i.test(file.name || "");
}

/** Underlay = trace image/PDF. Import walls = DXF/SVG → ExtractionResult. */
export function classifyPlanUpload(file: Pick<File, "name" | "type">): PlanImportKind {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (isPdfNameOrType(file)) return "underlay-pdf";
  if (name.endsWith(".dxf") || name.endsWith(".svg") || type.includes("dxf") || type.includes("svg")) {
    return "import-walls";
  }
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/.test(name)) return "underlay-image";
  return "unsupported";
}

export function planImportMismatchMessage(kind: PlanImportKind, expected: "underlay" | "import-walls"): string | null {
  if (expected === "underlay" && kind === "import-walls") {
    return "DXF and SVG belong under Import walls, not the tracing underlay.";
  }
  if (expected === "import-walls" && (kind === "underlay-image" || kind === "underlay-pdf")) {
    return "PNG, JPG, and PDF are tracing underlays. Use Import walls for DXF or SVG.";
  }
  if (kind === "unsupported") return "That file type is not supported for this action.";
  return null;
}
