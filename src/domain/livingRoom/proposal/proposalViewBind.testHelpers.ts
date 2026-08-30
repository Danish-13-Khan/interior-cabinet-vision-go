import type { InteriorProject } from "../../interiorProject";
import { PROPOSAL_TEST_PNG } from "./goldenProposal";

export const BIND_NOW = "2026-08-30T10:00:00.000Z";

export function withSecondView(project: InteriorProject): InteriorProject {
  const hero = project.cameras[0];
  if (!hero) throw new Error("Golden project has no camera.");
  const second = { ...hero, id: `${hero.id}-b`, name: "Second angle", isDefault: false };
  return {
    ...project,
    cameras: [...project.cameras, second],
    renderSettings: {
      ...project.renderSettings,
      packageCameraBookmarks: [
        { cameraId: hero.id, viewName: "Hero perspective" },
        { cameraId: second.id, viewName: "Second angle" },
      ],
    },
  };
}

export function acceptedStill(
  document: InteriorProject,
  cameraId: string,
  projectContentHash: string,
) {
  return {
    provenance: {
      cameraId,
      projectId: document.id,
      projectContentHash,
      acceptanceStatus: "accepted" as const,
    },
    stillDataUrl: PROPOSAL_TEST_PNG,
  };
}

export function renderFor(document: InteriorProject, cameraId: string, sceneFingerprint: string) {
  return {
    id: "r1",
    dataUrl: PROPOSAL_TEST_PNG,
    createdAt: BIND_NOW,
    projectId: document.id,
    sceneFingerprint,
    cameraId,
    cameraName: "View",
    quality: "draft" as const,
    widthPx: 8,
    heightPx: 8,
    lightingRecipeId: "day",
    exposure: 1,
    transparentBackground: false,
    composition: "project-camera" as const,
  };
}

export function moveFirstCabinet(document: InteriorProject, deltaX: number): InteriorProject {
  const cabinet = document.objects.find((object) => object.kind === "cabinet");
  return {
    ...document,
    objects: document.objects.map((object) =>
      object.id === cabinet?.id
        ? { ...object, position: { ...object.position, x: object.position.x + deltaX } }
        : object,
    ),
  };
}
