import { describe, expect, it } from "vitest";
import {
  assembleClientPresentationFiles,
  buildClientPackageViews,
  createLivingRoomReleaseDemoProject,
  stillJobProjectContentHash,
} from "..";

const NOW = "2026-08-28T18:00:00.000Z";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("client package camera bookmarks", () => {
  it("exports ordered named views in manifest and package-views.json", async () => {
    const project = createLivingRoomReleaseDemoProject();
    expect(project.renderSettings.packageCameraBookmarks.length).toBeGreaterThan(0);

    const views = buildClientPackageViews(project);
    expect(views.length).toBe(project.renderSettings.packageCameraBookmarks.length);
    expect(views[0]?.sortOrder).toBe(1);

    const { files, packageData } = await assembleClientPresentationFiles(project, null, NOW);
    expect(packageData.manifest.packageViews.length).toBe(views.length);
    expect(packageData.manifest.files).toContain(packageData.fileNames.packageViews);
    expect(packageData.manifest.presentationHonesty?.disclaimer).toContain("not interchangeable");
    const deckFile = files.find((file) => file.fileName.endsWith("-package-views.json"));
    expect(deckFile).toBeTruthy();
    expect(String(deckFile?.contents)).toContain(views[0]?.viewName ?? "");
  });

  it("omits package-views.json when the deck is empty", async () => {
    const project = createLivingRoomReleaseDemoProject();
    project.renderSettings.packageCameraBookmarks = [];
    const { files, packageData } = await assembleClientPresentationFiles(project, null, NOW);
    expect(packageData.manifest.packageViews).toEqual([]);
    expect(packageData.manifest.files).not.toContain(packageData.fileNames.packageViews);
    expect(files.find((file) => file.fileName.endsWith("-package-views.json"))).toBeUndefined();
  });

  it("records accepted still job ids on matching package views", async () => {
    const project = createLivingRoomReleaseDemoProject();
    const cameraId = project.renderSettings.packageCameraBookmarks[0]!.cameraId;
    const accepted = {
      schemaVersion: 2 as const,
      jobId: "sj-deck",
      projectId: project.id,
      projectContentHash: stillJobProjectContentHash(project),
      snapshotId: "snap",
      cameraId,
      engine: { id: "stilljob-hero", version: "1.0.0" },
      seed: 0,
      allowedEnhancements: ["exposure_grade"] as const,
      mode: "faithful_enhance" as const,
      acceptanceStatus: "accepted" as const,
      stillOutputPath: "sj-deck-still.png",
    };
    const { packageData } = await assembleClientPresentationFiles(
      project,
      null,
      NOW,
      [accepted],
      [{ fileName: "sj-deck-still.png", dataUrl: TINY_PNG }],
    );
    const view = packageData.manifest.packageViews.find((item) => item.cameraId === cameraId);
    expect(view?.acceptedStillJobId).toBe("sj-deck");
  });
});
