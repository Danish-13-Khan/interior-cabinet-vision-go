import type { WorkbenchMode } from "../desktopUx/workbench";

/** Report Center tabs the Interiors→engineering bridge may open. */
export type EngineerReportTab =
  | "packet"
  | "schedule"
  | "runs"
  | "cutlist"
  | "hardware"
  | "costing"
  | "quote"
  | "review";

export type EngineerBridgeIntent = "edit" | "packet" | "reports" | "production";

export type EngineerBridgeTarget = {
  intent: EngineerBridgeIntent;
  workbenchMode: WorkbenchMode;
  reportCenterTab: EngineerReportTab | null;
  focus: "cabinets" | "packet" | "cutlist" | "costing" | "production";
  label: string;
};

export type EngineerDepthItemId =
  | "handoff-sent"
  | "identities"
  | "cutlist"
  | "hardware"
  | "costing"
  | "packet";

export type EngineerDepthItem = {
  id: EngineerDepthItemId;
  label: string;
  ready: boolean;
  detail: string;
};
