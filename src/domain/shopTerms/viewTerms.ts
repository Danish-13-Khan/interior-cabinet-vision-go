/** Workspace / sheet / report view vocabulary (cabinet industry). */
export type ShopViewId =
  | "plan"
  | "front"
  | "side"
  | "section"
  | "detail"
  | "report"
  | "model";

export const VIEW_TAB_LABELS: Record<"plan" | "front" | "side" | "model", string> =
  {
    plan: "Plan",
    front: "Elev.",
    side: "Side",
    model: "Model",
  };

export const VIEW_FULL_LABELS: Record<ShopViewId, string> = {
  plan: "Floor Plan",
  front: "Front Elevation",
  side: "Side Elevation",
  section: "Building Section",
  detail: "Cabinet Detail",
  report: "Cabinet Schedule",
  model: "3D Model",
};

export const VIEW_SHEET_LABELS: Record<
  "top" | "front" | "side" | "section" | "detail" | "report",
  string
> = {
  top: "PLAN",
  front: "FRONT ELEV.",
  side: "SIDE ELEV.",
  section: "SECTION",
  detail: "DETAIL",
  report: "SCHEDULE",
};

export function viewTabLabel(id: "plan" | "front" | "side" | "3d"): string {
  if (id === "3d") return VIEW_TAB_LABELS.model;
  return VIEW_TAB_LABELS[id];
}

export function viewFullLabel(id: ShopViewId): string {
  return VIEW_FULL_LABELS[id];
}

export function viewSheetLabel(
  kind: keyof typeof VIEW_SHEET_LABELS,
): string {
  return VIEW_SHEET_LABELS[kind];
}
