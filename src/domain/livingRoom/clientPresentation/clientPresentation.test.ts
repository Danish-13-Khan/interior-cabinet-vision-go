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
  preferLivingRoomBrowserThumbnail,
  siblingPackagePath,
} from ".";

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

    const pdf = files.find((file) => file.kind === "pdf")!;
    expect(pdf.contents).toBeInstanceOf(Blob);
    expect((pdf.contents as Blob).type).toContain("pdf");

    const projectFile = files.find((file) => file.fileName.endsWith("-project.json"))!;
    expect(String(projectFile.contents)).toContain('"format"');
    expect(String(projectFile.contents)).toContain(project.id);
    expect(JSON.stringify(packageData)).not.toMatch(/cutlist|workshop|machine/i);
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
});
