export type DrawingSheetId =
  | "plan"
  | "front"
  | "side"
  | "section"
  | "detail"
  | "report";

export type DrawingSheetDef = {
  id: DrawingSheetId;
  code: string;
  title: string;
  shortLabel: string;
  /** Displayed scale string, e.g. 1:100 */
  scaleText: string;
  group: "plan" | "elevation" | "section" | "detail" | "schedule";
  /** Maps to interactive technical view when applicable */
  technicalView?: "top" | "front" | "side" | "section" | "detail";
  /** Focus tab for CAD panes when applicable */
  workspaceTab?: "plan" | "front" | "side";
};

export type DrawingSheetMeta = {
  code: string;
  title: string;
  scaleText: string;
  projectName?: string;
  revision?: string;
};
