/** Pure copy helpers for Materials area apply feedback (Step 5). */

export type SurfacePaintTarget = "floor" | "ceiling" | "wall" | "selection";

export function surfacePaintScopeLabel(input: {
  target: SurfacePaintTarget;
  wallSide?: string | null;
  selectionCount: number;
  slotName?: string | null;
}): string {
  if (input.target === "floor") return "This room floor";
  if (input.target === "ceiling") return "This room ceiling";
  if (input.target === "wall") {
    const side = input.wallSide?.trim();
    return side ? `Wall · ${side}` : "Active wall";
  }
  const count = Math.max(0, input.selectionCount);
  const slot = input.slotName?.trim();
  if (count <= 0) return "Selection · none";
  if (slot) return `Selection · ${count} object${count === 1 ? "" : "s"} · slot ${slot}`;
  return `Selection · ${count} object${count === 1 ? "" : "s"}`;
}

export function surfacePaintCurrentFinishLabel(input: {
  finishName?: string | null;
  materialId?: string | null;
}): string {
  const name = input.finishName?.trim();
  if (name) return name;
  const id = input.materialId?.trim();
  if (id) return id;
  return "None assigned";
}
