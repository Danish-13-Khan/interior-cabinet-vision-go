export type CanvasActionAlternative = {
  action: string;
  canvas: string;
  alternative: string;
};

/** Golden workflow canvas actions and their inspector or keyboard paths. */
export const GOLDEN_WORKFLOW_CANVAS_ALTERNATIVES: readonly CanvasActionAlternative[] = [
  { action: "select-cabinet", canvas: "Click the plan or 3D object", alternative: "Inspector object list or [ / ] keys" },
  { action: "move-cabinet", canvas: "Drag on the plan or in 3D", alternative: "Inspector X/Y/Z fields or arrow keys" },
  { action: "resize-cabinet", canvas: "Drag size handles", alternative: "Inspector W/H/D millimetre fields" },
  { action: "rotate-cabinet", canvas: "Rotate handle on the canvas", alternative: "Inspector rotation or R key" },
  { action: "change-finish", canvas: "None — finish is inspector-only", alternative: "Inspector finish select" },
];
