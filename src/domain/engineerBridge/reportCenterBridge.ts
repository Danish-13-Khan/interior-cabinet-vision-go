/**
 * Interiors → Report Center / engineering workbench bridge (Phase F).
 * Formalizes post-handoff landing without inventing a second handoff engine.
 */

import type {
  EngineerBridgeIntent,
  EngineerBridgeTarget,
  EngineerDepthItem,
  EngineerReportTab,
} from "./types";

const TARGETS: Record<EngineerBridgeIntent, EngineerBridgeTarget> = {
  edit: {
    intent: "edit",
    workbenchMode: "cabinets",
    reportCenterTab: null,
    focus: "cabinets",
    label: "Open Cabinets engineering shell",
  },
  packet: {
    intent: "packet",
    workbenchMode: "reports",
    reportCenterTab: "packet",
    focus: "packet",
    label: "Open Report Center packet",
  },
  reports: {
    intent: "reports",
    workbenchMode: "reports",
    reportCenterTab: "cutlist",
    focus: "cutlist",
    label: "Open Report Center cutlist",
  },
  production: {
    intent: "production",
    workbenchMode: "production",
    reportCenterTab: "packet",
    focus: "production",
    label: "Open Production packet",
  },
};

/** Default after Present → Send to Engineering (matches App today). */
export const DEFAULT_POST_HANDOFF_INTENT: EngineerBridgeIntent = "edit";

export function resolvePostHandoffBridge(
  intent: EngineerBridgeIntent = DEFAULT_POST_HANDOFF_INTENT,
): EngineerBridgeTarget {
  return TARGETS[intent];
}

export function listEngineerBridgeIntents(): EngineerBridgeIntent[] {
  return Object.keys(TARGETS) as EngineerBridgeIntent[];
}

export function engineerReportTabs(): EngineerReportTab[] {
  return [
    "packet",
    "schedule",
    "runs",
    "cutlist",
    "hardware",
    "costing",
    "quote",
    "review",
  ];
}

export function interiorsToReportCenterHint(input: {
  handoffSent: boolean;
  revisionApproved: boolean;
}): string {
  if (!input.revisionApproved) {
    return "Approve the quoted revision before sending to Engineering / Report Center.";
  }
  if (!input.handoffSent) {
    return "Send to Engineering to open the same cabinet IDs in Cabinets or Report Center.";
  }
  return "Handoff recorded — continue in Cabinets or open Report Center for packet / cutlist.";
}

/**
 * Engineer depth checklist foundations over existing report / handoff signals.
 * Does not compute cutlists — only readiness flags callers already know.
 */
export function buildEngineerDepthChecklist(input: {
  handoffSent: boolean;
  cabinetCount: number;
  cutlistLineCount: number;
  hardwareLineCount: number;
  hasCosting: boolean;
  packetReady?: boolean;
}): EngineerDepthItem[] {
  return [
    {
      id: "handoff-sent",
      label: "Handoff recorded",
      ready: input.handoffSent,
      detail: input.handoffSent
        ? "Revision snapshot stored for Engineering"
        : "Send from Present when approved",
    },
    {
      id: "identities",
      label: "Cabinet identities",
      ready: input.cabinetCount > 0,
      detail: input.cabinetCount > 0
        ? `${input.cabinetCount} cabinet${input.cabinetCount === 1 ? "" : "s"}`
        : "No cabinets to refine",
    },
    {
      id: "cutlist",
      label: "Cutlist",
      ready: input.cutlistLineCount > 0,
      detail: input.cutlistLineCount > 0
        ? `${input.cutlistLineCount} part line${input.cutlistLineCount === 1 ? "" : "s"}`
        : "Awaiting production cutlist",
    },
    {
      id: "hardware",
      label: "Hardware schedule",
      ready: input.hardwareLineCount > 0,
      detail: input.hardwareLineCount > 0
        ? `${input.hardwareLineCount} hardware line${input.hardwareLineCount === 1 ? "" : "s"}`
        : "No hardware lines yet",
    },
    {
      id: "costing",
      label: "Costing",
      ready: input.hasCosting,
      detail: input.hasCosting ? "Workshop cost available" : "Costing not ready",
    },
    {
      id: "packet",
      label: "Shop packet",
      ready: Boolean(input.packetReady),
      detail: input.packetReady ? "Packet sections ready" : "Packet pending",
    },
  ];
}

export function engineerDepthReadyCount(items: readonly EngineerDepthItem[]): {
  ready: number;
  total: number;
} {
  return {
    ready: items.filter((item) => item.ready).length,
    total: items.length,
  };
}
