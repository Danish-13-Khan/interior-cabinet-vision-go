export type TechnicalObjectKind =
  | "cabinet"
  | "opening"
  | "note"
  | "leader"
  | "dim"
  | "tag";

export type TechnicalObjectSelection =
  | { kind: "cabinet"; id: string }
  | { kind: "opening"; cabinetId: string; openingId: string }
  | { kind: "note"; id: string }
  | { kind: "leader"; id: string }
  | { kind: "dim"; id: string }
  | { kind: "tag"; cabinetId: string }
  | null;

export type DraftingDimOffset = {
  id: string;
  /** SVG px lane offset */
  dx: number;
  dy: number;
};

export type DraftingTagOffset = {
  cabinetId: string;
  dx: number;
  dy: number;
};

export function technicalObjectLabel(selection: TechnicalObjectSelection): string {
  if (!selection) return "Nothing selected";
  switch (selection.kind) {
    case "cabinet":
      return `Cabinet · ${selection.id}`;
    case "opening":
      return `Opening · ${selection.openingId}`;
    case "note":
      return `Note · ${selection.id}`;
    case "leader":
      return `Leader · ${selection.id}`;
    case "dim":
      return `Dimension · ${selection.id}`;
    case "tag":
      return `Tag · ${selection.cabinetId}`;
  }
}

/** Stable id used for SVG highlight of draft objects (not cabinets/openings). */
export function draftHighlightId(selection: TechnicalObjectSelection): string | null {
  if (!selection) return null;
  if (selection.kind === "note" || selection.kind === "leader" || selection.kind === "dim") {
    return selection.id;
  }
  if (selection.kind === "tag") return `tag-${selection.cabinetId}`;
  return null;
}
