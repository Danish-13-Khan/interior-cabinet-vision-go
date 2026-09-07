export type ContextualRailKind = "none" | "wall" | "cabinet" | "panel" | "other";

export type ContextualRailCommandId =
  | "select"
  | "measure"
  | "camera"
  | "material"
  | "add-panel"
  | "hide-wall"
  | "rotate"
  | "flip-side"
  | "duplicate"
  | "delete";

export type ContextualRailCommand = {
  id: ContextualRailCommandId;
  label: string;
  testId: string;
};

const COMMANDS: Record<ContextualRailCommandId, ContextualRailCommand> = {
  select: { id: "select", label: "Select", testId: "rail-select" },
  measure: { id: "measure", label: "Measure", testId: "rail-measure" },
  camera: { id: "camera", label: "Camera", testId: "rail-camera" },
  material: { id: "material", label: "Material", testId: "rail-material" },
  "add-panel": { id: "add-panel", label: "Add Panel", testId: "rail-add-panel" },
  "hide-wall": { id: "hide-wall", label: "Hide Wall", testId: "rail-hide-wall" },
  rotate: { id: "rotate", label: "Rotate", testId: "rail-rotate" },
  "flip-side": { id: "flip-side", label: "Flip Side", testId: "rail-flip-side" },
  duplicate: { id: "duplicate", label: "Duplicate", testId: "rail-duplicate" },
  delete: { id: "delete", label: "Delete", testId: "rail-delete" },
};

const BY_KIND: Record<ContextualRailKind, readonly ContextualRailCommandId[]> = {
  none: ["select", "measure", "camera"],
  wall: ["material", "add-panel", "hide-wall"],
  cabinet: ["rotate", "duplicate", "material", "delete"],
  /** Panels: attachment-aware flip — not free Y rotate (reflow would overwrite). */
  panel: ["flip-side", "duplicate", "material", "delete"],
  other: ["rotate", "duplicate", "material", "delete"],
};

function isPanelObject(object: { category?: string; catalogItemId?: string }) {
  return object.category === "wall-panel"
    || object.category === "feature-wall"
    || Boolean(object.catalogItemId?.includes("decorative-panel"))
    || Boolean(object.catalogItemId?.includes("feature-wall"));
}

function isCabinetObject(object: { category?: string; kind?: string }) {
  return object.kind === "cabinet"
    || object.category === "cabinet"
    || object.category === "base"
    || object.category === "wall"
    || object.category === "tall"
    || object.category === "drawer"
    || object.category === "open-shelf"
    || object.category === "storage";
}

/** Resolve §4.1 selection kind for the contextual command rail. */
export function resolveContextualRailKind(input: {
  activeWallId: string | null;
  selectedObjects: readonly { category?: string; kind?: string; catalogItemId?: string }[];
}): ContextualRailKind {
  const selected = input.selectedObjects;
  if (selected.length === 1 && isPanelObject(selected[0]!)) return "panel";
  if (selected.length >= 1 && selected.every(isCabinetObject)) return "cabinet";
  if (selected.length >= 1) return "other";
  if (input.activeWallId) return "wall";
  return "none";
}

export function contextualRailCommands(
  kind: ContextualRailKind,
  options?: { workspaceView?: "plan" | "model" | "render" },
): ContextualRailCommand[] {
  const ids = BY_KIND[kind].filter((id) => {
    // Measure is a 2D plan tool — omit in Model so the rail never dead-ends.
    if (id === "measure" && options?.workspaceView === "model") return false;
    return true;
  });
  return ids.map((id) => COMMANDS[id]);
}
