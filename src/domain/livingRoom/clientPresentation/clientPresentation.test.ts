import { describe, expect, it } from "vitest";
import {
  createLivingRoomReleaseDemoProject,
  createLivingRoomRenderResult,
  compileLivingRoomScene,
} from "..";
import {
  assembleClientPresentationFiles,
  buildClientPresentationPackage,
  clientPresentationBasePath,
  clientPresentationPackageDirectory,
  packageFilePath,
  preferLivingRoomBrowserThumbnail,
  siblingPackagePath,
  withAcceptedStillProvenance,
} from ".";
import { stillJobProjectContentHash } from "../stillJob/projectHash";

const NOW = "2026-08-12T21:00:00.000Z";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("client presentation package", () => {
  it("builds room summary, objects, materials, and camera metadata", () => {
    const project = createLivingRoomReleaseDemoProject();
    const scene = compileLivingRoomScene(project);
    const render = createLivingRoomRenderResult({
      dataUrl: TINY_PNG,
      project,
      sceneFingerprint: scene.fingerprint,
      camera: scene.cameras[0],
      now: NOW,
    });
    const pack = buildClientPresentationPackage(project, render, NOW);

    expect(pack.manifest.kind).toBe("living-room-client-preview");
    expect(pack.manifest.deliverable).toBe("client-presentation");
    expect(pack.roomSummary.objectCount).toBe(project.objects.length);
    expect(pack.objects.length).toBe(project.objects.length);
    expect(pack.materials.length).toBe(project.materials.length);
    expect(pack.cameras.some((camera) => camera.active)).toBe(true);
    expect(pack.heroRenderDataUrl).toBe(TINY_PNG);
    expect(pack.fileNames.presentationPdf).toContain("client-preview.pdf");
    expect(pack.fileNames.stillsProvenance).toContain("stills-provenance.json");
    expect(pack.manifest.acceptedStills).toEqual([]);
    expect(JSON.parse(pack.projectJson).id).toBe(project.id);
  });

  it("assembles export files without workshop cutlist content", async () => {
    const project = createLivingRoomReleaseDemoProject();
    const scene = compileLivingRoomScene(project);
    const render = createLivingRoomRenderResult({
      dataUrl: TINY_PNG,
      project,
      sceneFingerprint: scene.fingerprint,
      camera: scene.cameras[0],
      now: NOW,
    });
    const { files, packageData } = await assembleClientPresentationFiles(
      project,
      render,
      NOW,
    );
    const names = files.map((file) => file.fileName);
    expect(names).toContain(packageData.fileNames.presentationPdf);
    expect(names).toContain(packageData.fileNames.heroPng);
    expect(names).toContain(packageData.fileNames.projectJson);
    expect(names).toContain(packageData.fileNames.roomSummary);
    expect(names).toContain(packageData.fileNames.objects);
    expect(names).toContain(packageData.fileNames.materials);
    expect(names).toContain(packageData.fileNames.cameras);
    expect(names).toContain(packageData.fileNames.manifest);
    expect(names).toContain(packageData.fileNames.millworkSchedulePdf);
    expect(names).toContain(packageData.fileNames.millworkScheduleCsv);
    expect(packageData.manifest.workshopSchedule?.lineCount).toBeGreaterThan(0);

    const pdf = files.find((file) => file.kind === "pdf" && file.fileName.endsWith("-client-preview.pdf"))!;
    expect(pdf.contents).toBeInstanceOf(Blob);
    expect((pdf.contents as Blob).type).toContain("pdf");

    const projectFile = files.find((file) => file.fileName.endsWith("-project.json"))!;
    expect(String(projectFile.contents)).toContain('"format"');
    expect(String(projectFile.contents)).toContain(project.id);
    expect(JSON.stringify(packageData)).not.toMatch(/cutlist|machine/i);
    expect(packageData.manifest.workshopSchedule?.pdfFile).toBe(packageData.fileNames.millworkSchedulePdf);

    const manifestFile = files.find((file) => file.fileName.endsWith("-manifest.json"))!;
    const manifestJson = JSON.parse(String(manifestFile.contents)) as {
      files: string[];
      workshopSchedule?: { lineCount: number; pdfFile: string };
    };
    expect(manifestJson.files).toContain(packageData.fileNames.millworkSchedulePdf);
    expect(manifestJson.files).toContain(packageData.fileNames.millworkScheduleCsv);
    expect(manifestJson.workshopSchedule?.lineCount).toBeGreaterThan(0);
  });

  it("excludes Draft hero renders from client package files and honesty", async () => {
    const project = createLivingRoomReleaseDemoProject();
    const scene = compileLivingRoomScene(project);
    const draftRender = createLivingRoomRenderResult({
      dataUrl: TINY_PNG,
      project: {
        ...project,
        renderSettings: {
          ...project.renderSettings,
          quality: "draft",
        },
      },
      sceneFingerprint: scene.fingerprint,
      camera: scene.cameras[0],
      now: NOW,
    });
    expect(draftRender.quality).toBe("draft");

    const { files, packageData } = await assembleClientPresentationFiles(
      project,
      draftRender,
      NOW,
    );
    expect(files.some((file) => file.fileName.endsWith("-hero-render.png"))).toBe(false);
    expect(packageData.heroRenderDataUrl).toBeNull();
    expect(packageData.manifest.render).toBeNull();
    expect(packageData.manifest.files).not.toContain(packageData.fileNames.heroPng);
    expect(packageData.manifest.presentationHonesty?.tiers ?? []).toEqual([]);
  });

  it("prefers render thumbnails for the project browser", () => {
    const plan = "data:image/svg+xml;charset=utf-8,plan";
    const render = "data:image/jpeg;base64,abc";
    expect(preferLivingRoomBrowserThumbnail(render, plan)).toBe(render);
    expect(preferLivingRoomBrowserThumbnail(null, plan)).toBe(plan);
  });

  it("derives sibling package paths from the PDF save location", () => {
    expect(clientPresentationBasePath("/tmp/demo-client-preview.pdf")).toBe(
      "/tmp/demo-client-preview",
    );
    expect(siblingPackagePath("/tmp/demo-client-preview", "demo-objects.json")).toBe(
      "/tmp/demo-objects.json",
    );
  });

  it("derives package folder paths for desktop client preview exports", () => {
    const directory = clientPresentationPackageDirectory("/tmp/demo-client-preview.pdf");
    expect(directory).toBe("/tmp/demo-client-preview");
    expect(packageFilePath(directory, "demo-client-preview.pdf")).toBe(
      "/tmp/demo-client-preview/demo-client-preview.pdf",
    );
    expect(packageFilePath("C:\\Temp\\demo-client-preview", "demo-objects.json")).toBe(
      "C:\\Temp\\demo-client-preview\\demo-objects.json",
    );
  });

  it("records only accepted still provenance on the package manifest", () => {
    const project = createLivingRoomReleaseDemoProject();
    const pack = buildClientPresentationPackage(project, null, NOW);
    const accepted = withAcceptedStillProvenance(pack.manifest, project, [
      {
        schemaVersion: 2,
        jobId: "sj-1",
        projectId: project.id,
        projectContentHash: stillJobProjectContentHash(project),
        snapshotId: "snap",
        cameraId: "cam-a",
        engine: { id: "stilljob-handoff", version: "0.2.0" },
        seed: 0,
        allowedEnhancements: ["soft_shadows"],
        mode: "faithful_enhance",
        acceptanceStatus: "accepted",
        acceptedAt: NOW,
      },
      {
        schemaVersion: 2,
        jobId: "sj-2",
        projectId: project.id,
        projectContentHash: stillJobProjectContentHash(project),
        snapshotId: "snap",
        cameraId: "cam-a",
        engine: { id: "stilljob-handoff", version: "0.2.0" },
        seed: 0,
        allowedEnhancements: [],
        mode: "faithful_enhance",
        acceptanceStatus: "rejected",
      },
    ]);
    expect(accepted.acceptedStills).toHaveLength(1);
    expect(accepted.acceptedStills[0]?.jobId).toBe("sj-1");
  });

  it("adds accepted still PNGs to the package and skips rejected ones", async () => {
    const project = createLivingRoomReleaseDemoProject();
    const accepted = {
      schemaVersion: 2,
      jobId: "sj-pack",
      projectId: project.id,
      projectContentHash: stillJobProjectContentHash(project),
      snapshotId: "snap",
      cameraId: "cam-a",
      engine: { id: "stilljob-hero", version: "1.0.0" },
      seed: 0,
      allowedEnhancements: ["exposure_grade"] as const,
      mode: "faithful_enhance" as const,
      acceptanceStatus: "accepted" as const,
      stillOutputPath: "sj-pack-still.png",
    };
    const { files, packageData } = await assembleClientPresentationFiles(
      project,
      null,
      NOW,
      [accepted],
      [{ fileName: "sj-pack-still.png", dataUrl: TINY_PNG }],
    );
    expect(files.some((file) => file.fileName === "sj-pack-still.png")).toBe(true);
    expect(packageData.manifest.files).toContain("sj-pack-still.png");
    expect(packageData.manifest.acceptedStills).toHaveLength(1);
  });
});
