import { describe, expect, it } from "vitest";
import type { LivingRoomPlanIssue } from "../planConstraints";
import { createLivingRoomReleaseDemoProject } from "../releaseDemo";
import {
  buildPreExportChecklist,
  countResolvedPackageDeckViews,
  isPreExportBlocked,
} from "./preExportChecklist";

const overlap: LivingRoomPlanIssue = {
  code: "overlap",
  severity: "error",
  objectIds: ["a", "b"],
  message: "A overlaps B.",
};

const clearance: LivingRoomPlanIssue = {
  code: "circulation",
  severity: "warning",
  objectIds: ["c"],
  message: "Tight clearance.",
};

describe("buildPreExportChecklist", () => {
  it("blocks export when layout or millwork fails", () => {
    const blocked = buildPreExportChecklist({
      issues: [overlap],
      millworkCount: 2,
      packageDeckCount: 1,
      acceptedStillCount: 0,
    });
    expect(blocked.ready).toBe(false);
    expect(isPreExportBlocked(blocked)).toBe(true);
    expect(blocked.items.find((item) => item.id === "layout-clear")?.status).toBe("fail");
    expect(blocked.items.find((item) => item.id === "accepted-stills")?.status).toBe("warn");

    const empty = buildPreExportChecklist({
      issues: [],
      millworkCount: 0,
      packageDeckCount: 0,
      acceptedStillCount: 0,
    });
    expect(empty.ready).toBe(false);
    expect(empty.items.find((item) => item.id === "millwork-placed")?.status).toBe("fail");
    expect(empty.items.find((item) => item.id === "package-deck")?.status).toBe("warn");
  });

  it("is ready when blocking checks pass even with advisories", () => {
    const ready = buildPreExportChecklist({
      issues: [clearance],
      millworkCount: 4,
      packageDeckCount: 3,
      acceptedStillCount: 1,
    });
    expect(ready.ready).toBe(true);
    expect(ready.blockingFailCount).toBe(0);
    expect(ready.warnCount).toBe(1);
    expect(ready.items.find((item) => item.id === "layout-advisories")?.status).toBe("warn");
    expect(ready.items.find((item) => item.id === "layout-clear")?.status).toBe("pass");
  });

  it("counts only package deck views whose cameras still exist", () => {
    const project = createLivingRoomReleaseDemoProject();
    const rawCount = project.renderSettings.packageCameraBookmarks.length;
    expect(rawCount).toBeGreaterThan(0);
    expect(countResolvedPackageDeckViews(project)).toBe(rawCount);

    const stale = {
      ...project,
      cameras: [],
      renderSettings: {
        ...project.renderSettings,
        packageCameraBookmarks: [
          ...project.renderSettings.packageCameraBookmarks,
          { cameraId: "missing-after-room-delete", viewName: "Ghost View", sortOrder: 99 },
        ],
      },
    };
    expect(stale.renderSettings.packageCameraBookmarks.length).toBeGreaterThan(rawCount);
    expect(countResolvedPackageDeckViews(stale)).toBe(0);

    const checklist = buildPreExportChecklist({
      issues: [],
      millworkCount: 4,
      packageDeckCount: countResolvedPackageDeckViews(stale),
      acceptedStillCount: 0,
    });
    expect(checklist.items.find((item) => item.id === "package-deck")?.status).toBe("warn");
  });
});
