import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import { setLivingRoomPlanUnderlay } from "./planUnderlay";
import {
  getSiteMeasureChecklist,
  listSiteMeasureChecklistItems,
  setSiteMeasureChecklist,
  toggleSiteMeasureChecklistItem,
} from "./siteMeasureChecklist";

const NOW = "2026-09-05T08:00:00.000Z";

describe("siteMeasureChecklist", () => {
  it("persists user toggles in project extensions", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const next = setSiteMeasureChecklist(project, { wallsMeasured: true, doorSizes: true });
    expect(getSiteMeasureChecklist(next)).toEqual({ wallsMeasured: true, doorSizes: true });
    expect(toggleSiteMeasureChecklistItem(next, "wallsMeasured").extensions?.siteMeasureChecklist)
      .toMatchObject({ wallsMeasured: false, doorSizes: true });
  });

  it("auto-ticks underlay imported/calibrated from underlay state", () => {
    let project = createLivingRoomStarterProject({ now: NOW });
    expect(listSiteMeasureChecklistItems(project).find((item) => item.key === "underlayImported")?.checked)
      .toBe(false);
    project = setLivingRoomPlanUnderlay(project, {
      fileName: "plan.png",
      dataUrl: "data:image/png;base64,cGxhbg==",
      widthMm: 4000,
      heightMm: 3000,
      opacity: 0.4,
      calibrated: true,
    });
    const items = listSiteMeasureChecklistItems(project);
    expect(items.find((item) => item.key === "underlayImported")).toMatchObject({ checked: true, auto: true });
    expect(items.find((item) => item.key === "underlayCalibrated")).toMatchObject({ checked: true, auto: true });
  });
});
