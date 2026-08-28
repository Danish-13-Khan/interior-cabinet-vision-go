import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomRenderResult } from "../renderStudio";
import { compileLivingRoomScene } from "../sceneCompiler";
import {
  clientPresentationSlug,
  type ClientCameraMetadata,
  type ClientMaterialPaletteItem,
  type ClientObjectListItem,
  type ClientPresentationManifest,
  type ClientPresentationPackage,
  type ClientRoomSummary,
} from "./buildPackageTypes";

/** Build client-facing package metadata (no workshop/cutlist content). */
export function buildClientPresentationPackage(
  project: InteriorProject,
  render: LivingRoomRenderResult | null,
  now = new Date().toISOString(),
): ClientPresentationPackage {
  const scene = compileLivingRoomScene(project);
  const room = project.rooms.find((item) => item.id === project.activeRoomId)
    ?? project.rooms[0];
  const base = clientPresentationSlug(project.name);
  const roomSummary: ClientRoomSummary = {
    projectId: project.id,
    projectName: project.name,
    roomId: room?.id ?? "",
    roomName: room?.name ?? "Living Room",
    widthMm: room?.dimensions.widthMm ?? 0,
    depthMm: room?.dimensions.depthMm ?? 0,
    heightMm: room?.dimensions.heightMm ?? 0,
    objectCount: project.objects.length,
    materialCount: project.materials.length,
    cameraCount: project.cameras.length,
    styleId: scene.style.id,
    styleName: scene.style.name,
    lightingRecipeId: scene.lightingRecipeId,
  };

  const objects: ClientObjectListItem[] = project.objects.map((object) => ({
    id: object.id,
    name: object.name,
    category: object.category,
    catalogItemId: object.catalogItemId,
    widthMm: object.dimensions.widthMm,
    heightMm: object.dimensions.heightMm,
    depthMm: object.dimensions.depthMm,
    rotationY: object.rotation.y,
    materialSlots: { ...object.materialSlots },
  }));

  const materials: ClientMaterialPaletteItem[] = project.materials.map((material) => ({
    id: material.id,
    name: material.name,
    kind: material.kind,
    color: material.color,
    roughness: material.roughness,
    metalness: material.metalness,
  }));

  const activeCameraId = render?.cameraId
    ?? project.renderSettings.activeCameraId
    ?? project.cameras.find((camera) => camera.isDefault)?.id
    ?? project.cameras[0]?.id
    ?? null;

  const bookmarkByCamera = new Map(
    project.renderSettings.packageCameraBookmarks.map((bookmark) => [bookmark.cameraId, bookmark.viewName]),
  );

  const cameras: ClientCameraMetadata[] = project.cameras.map((camera) => ({
    id: camera.id,
    name: camera.name,
    isDefault: Boolean(camera.isDefault),
    fieldOfViewDegrees: camera.fieldOfViewDegrees,
    positionMm: { ...camera.position },
    targetMm: { ...camera.target },
    active: camera.id === activeCameraId,
    inPackageDeck: bookmarkByCamera.has(camera.id),
    packageViewName: bookmarkByCamera.get(camera.id) ?? null,
  }));

  const fileNames = {
    heroPng: `${base}-hero-render.png`,
    projectJson: `${base}-project.json`,
    roomSummary: `${base}-room-summary.json`,
    objects: `${base}-objects.json`,
    materials: `${base}-materials.json`,
    cameras: `${base}-cameras.json`,
    presentationPdf: `${base}-client-preview.pdf`,
    manifest: `${base}-manifest.json`,
    stillsProvenance: `${base}-stills-provenance.json`,
    packageViews: `${base}-package-views.json`,
  };

  const manifest: ClientPresentationManifest = {
    kind: "living-room-client-preview",
    version: 1,
    exportedAt: now,
    brand: "Interiors",
    deliverable: "client-presentation",
    files: Object.values(fileNames).filter(
      (name) => name !== fileNames.stillsProvenance && name !== fileNames.packageViews,
    ),
    roomSummary,
    render: render
      ? {
          cameraId: render.cameraId,
          cameraName: render.cameraName,
          quality: render.quality,
          widthPx: render.widthPx,
          heightPx: render.heightPx,
          lightingRecipeId: render.lightingRecipeId,
          exposure: render.exposure,
          composition: render.composition,
          createdAt: render.createdAt,
        }
      : null,
    acceptedStills: [],
    packageViews: [],
  };

  return {
    manifest,
    roomSummary,
    objects,
    materials,
    cameras,
    projectJson: JSON.stringify(project, null, 2),
    heroRenderDataUrl: render?.dataUrl ?? null,
    fileNames,
  };
}
