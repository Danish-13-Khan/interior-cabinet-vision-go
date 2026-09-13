import { describe, expect, it } from "vitest";
import {
  buildEngineerDepthChecklist,
  engineerDepthReadyCount,
  engineerReportTabs,
  interiorsToReportCenterHint,
  listEngineerBridgeIntents,
  resolvePostHandoffBridge,
} from "./reportCenterBridge";

describe("engineerBridge / Report Center (Phase F)", () => {
  it("defaults Present→Send to Cabinets engineering shell", () => {
    expect(resolvePostHandoffBridge()).toMatchObject({
      intent: "edit",
      workbenchMode: "cabinets",
      reportCenterTab: null,
      focus: "cabinets",
    });
  });

  it("routes packet / reports / production intents", () => {
    expect(resolvePostHandoffBridge("packet").workbenchMode).toBe("reports");
    expect(resolvePostHandoffBridge("packet").reportCenterTab).toBe("packet");
    expect(resolvePostHandoffBridge("reports").reportCenterTab).toBe("cutlist");
    expect(resolvePostHandoffBridge("production").workbenchMode).toBe("production");
    expect(listEngineerBridgeIntents()).toContain("edit");
    expect(engineerReportTabs()).toContain("cutlist");
  });

  it("hints the Interiors→Report Center path from handoff state", () => {
    expect(interiorsToReportCenterHint({
      handoffSent: false, revisionApproved: false,
    })).toContain("Approve");
    expect(interiorsToReportCenterHint({
      handoffSent: false, revisionApproved: true,
    })).toContain("Send to Engineering");
    expect(interiorsToReportCenterHint({
      handoffSent: true, revisionApproved: true,
    })).toContain("Report Center");
  });

  it("builds an engineer depth checklist over existing signals", () => {
    const items = buildEngineerDepthChecklist({
      handoffSent: true,
      cabinetCount: 2,
      cutlistLineCount: 12,
      hardwareLineCount: 0,
      hasCosting: true,
      packetReady: false,
    });
    expect(items.find((i) => i.id === "handoff-sent")?.ready).toBe(true);
    expect(items.find((i) => i.id === "hardware")?.ready).toBe(false);
    expect(engineerDepthReadyCount(items)).toEqual({ ready: 4, total: 6 });
  });
});
