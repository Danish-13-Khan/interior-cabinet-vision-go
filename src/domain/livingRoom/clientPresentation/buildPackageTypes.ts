import type { StillProvenance } from "../stillJob/provenance";
import type { ClientPresentationHonesty } from "../renderTierHonesty";

export type ClientRoomSummary = {
  projectId: string;
  projectName: string;
  roomId: string;
  roomName: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  objectCount: number;
  materialCount: number;
  cameraCount: number;
  styleId: string;
  styleName: string;
  lightingRecipeId: string;
};

export type ClientObjectListItem = {
  id: string;
  name: string;
  category: string;
  catalogItemId: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  rotationY: number;
  materialSlots: Record<string, string>;
};

export type ClientMaterialPaletteItem = {
  id: string;
  name: string;
  kind: string;
  color: string;
  roughness: number;
  metalness: number;
};

export type ClientCameraMetadata = {
  id: string;
  name: string;
  isDefault: boolean;
  fieldOfViewDegrees: number;
  positionMm: { x: number; y: number; z: number };
  targetMm: { x: number; y: number; z: number };
  active: boolean;
  inPackageDeck: boolean;
  packageViewName: string | null;
};

export type ClientPackageView = {
  cameraId: string;
  viewName: string;
  sortOrder: number;
  cameraName: string;
  fieldOfViewDegrees: number;
  isDefault: boolean;
  positionMm: { x: number; y: number; z: number };
  targetMm: { x: number; y: number; z: number };
  acceptedStillJobId: string | null;
};

export type ClientPresentationManifest = {
  kind: "living-room-client-preview";
  version: 1;
  exportedAt: string;
  brand: string;
  deliverable: "client-presentation";
  files: string[];
  roomSummary: ClientRoomSummary;
  render: {
    cameraId: string;
    cameraName: string;
    quality: string;
    widthPx: number;
    heightPx: number;
    lightingRecipeId: string;
    exposure: number;
    composition: string;
    createdAt: string;
  } | null;
  acceptedStills: StillProvenance[];
  packageViews: ClientPackageView[];
  presentationHonesty?: ClientPresentationHonesty;
};

export type ClientPresentationPackage = {
  manifest: ClientPresentationManifest;
  roomSummary: ClientRoomSummary;
  objects: ClientObjectListItem[];
  materials: ClientMaterialPaletteItem[];
  cameras: ClientCameraMetadata[];
  projectJson: string;
  heroRenderDataUrl: string | null;
  fileNames: {
    heroPng: string;
    projectJson: string;
    roomSummary: string;
    objects: string;
    materials: string;
    cameras: string;
    presentationPdf: string;
    manifest: string;
    stillsProvenance: string;
    packageViews: string;
  };
};

export function clientPresentationSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "living-room";
}
