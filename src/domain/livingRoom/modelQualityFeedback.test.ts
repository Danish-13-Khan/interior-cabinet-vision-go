import { describe, expect, it } from "vitest";
import {
  catalogPreviewFallbackLabel,
  collectModelQualityIssues,
  modelQualityBlockingCount,
  modelQualitySeverityClass,
} from "./modelQualityFeedback";
import { createLivingRoomStarterProject } from "./preset";

const NOW = "2026-09-09T12:00:00.000Z";

describe("modelQualityFeedback", () => {
  it("labels missing catalog previews", () => {
    expect(catalogPreviewFallbackLabel(true)).toBeNull();
    expect(catalogPreviewFallbackLabel(false)).toBe("No preview");
  });

  it("flags unknown catalog adapters as non-blocking soft-goods warnings", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const future = {
      ...project.objects[0]!,
      id: "future-object",
      name: "Future Object",
      kind: "furniture" as const,
      catalogItemId: "future:unregistered-object",
    };
    const issues = collectModelQualityIssues({
      ...project,
      objects: [...project.objects, future],
    });
    const missing = issues.find((issue) => issue.code === "missing-adapter");
    expect(missing?.objectId).toBe("future-object");
    expect(missing?.blocking).toBe(false);
    expect(modelQualitySeverityClass(missing!)).toBe("is-warning");
  });

  it("flags unknown cabinet adapters as blocking", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const future = {
      ...project.objects[0]!,
      id: "future-cabinet",
      name: "Future Cabinet",
      kind: "cabinet" as const,
      catalogItemId: "future:unregistered-cabinet",
    };
    const issues = collectModelQualityIssues({
      ...project,
      objects: [...project.objects, future],
    });
    const missing = issues.find((issue) => issue.objectId === "future-cabinet");
    expect(missing?.blocking).toBe(true);
    expect(modelQualityBlockingCount(issues)).toBeGreaterThanOrEqual(1);
  });

  it("marks simplified corner wardrobe adapters as preview-only", () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const corner = {
      ...project.objects[0]!,
      id: "corner-1",
      name: "Corner Wardrobe",
      kind: "cabinet" as const,
      catalogItemId: "living:corner-wardrobe",
    };
    const issues = collectModelQualityIssues({
      ...project,
      objects: [...project.objects, corner],
    });
    const preview = issues.find((issue) => issue.code === "preview-corner-adapter");
    expect(preview?.blocking).toBe(false);
    expect(preview?.severity).toBe("info");
    expect(modelQualitySeverityClass(preview!)).toBe("is-info");
  });
});
