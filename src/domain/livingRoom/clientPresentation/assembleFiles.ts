import type { InteriorProject } from "../../interiorProject";
import { serializeInteriorProjectFile } from "../../interiorProject";
import type { LivingRoomRenderResult } from "../renderStudio";
import type { StillProvenance } from "../stillJob/provenance";
import { withAcceptedStillProvenance } from "./acceptedStills";
import { acceptedStillPngFiles, type AcceptedStillPng } from "./acceptedStillFiles";
import {
  buildClientPresentationPackage,
  type ClientPresentationPackage,
} from "./buildPackage";
import { exportClientPresentationPdf } from "./exportPdf";

export type ClientPresentationFile = {
  fileName: string;
  kind: "json" | "png" | "pdf";
  contents: string | Blob;
};

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

/** Assemble downloadable client preview files (separate from workshop PDF). */
export async function assembleClientPresentationFiles(
  project: InteriorProject,
  render: LivingRoomRenderResult | null,
  now = new Date().toISOString(),
  acceptedStills: StillProvenance[] = [],
  acceptedStillPngs: AcceptedStillPng[] = [],
): Promise<{
  packageData: ClientPresentationPackage;
  files: ClientPresentationFile[];
}> {
  const built = buildClientPresentationPackage(project, render, now);
  const stillPngs = await acceptedStillPngFiles(acceptedStills, acceptedStillPngs);
  let manifest = withAcceptedStillProvenance(built.manifest, acceptedStills);
  if (manifest.acceptedStills.length) {
    manifest = {
      ...manifest,
      files: [
        ...manifest.files,
        built.fileNames.stillsProvenance,
        ...stillPngs.map((file) => file.fileName),
      ],
    };
  }
  const packageData = { ...built, manifest };
  const pdf = await exportClientPresentationPdf(project, render, packageData);
  const files: ClientPresentationFile[] = [
    {
      fileName: packageData.fileNames.presentationPdf,
      kind: "pdf",
      contents: pdf,
    },
    {
      fileName: packageData.fileNames.projectJson,
      kind: "json",
      contents: serializeInteriorProjectFile(project, now),
    },
    {
      fileName: packageData.fileNames.roomSummary,
      kind: "json",
      contents: JSON.stringify(packageData.roomSummary, null, 2),
    },
    {
      fileName: packageData.fileNames.objects,
      kind: "json",
      contents: JSON.stringify(packageData.objects, null, 2),
    },
    {
      fileName: packageData.fileNames.materials,
      kind: "json",
      contents: JSON.stringify(packageData.materials, null, 2),
    },
    {
      fileName: packageData.fileNames.cameras,
      kind: "json",
      contents: JSON.stringify(packageData.cameras, null, 2),
    },
    {
      fileName: packageData.fileNames.manifest,
      kind: "json",
      contents: JSON.stringify(packageData.manifest, null, 2),
    },
  ];

  if (packageData.manifest.acceptedStills.length) {
    files.push({
      fileName: packageData.fileNames.stillsProvenance,
      kind: "json",
      contents: JSON.stringify(packageData.manifest.acceptedStills, null, 2),
    });
    files.push(...stillPngs);
  }

  if (packageData.heroRenderDataUrl) {
    files.unshift({
      fileName: packageData.fileNames.heroPng,
      kind: "png",
      contents: await dataUrlToBlob(packageData.heroRenderDataUrl),
    });
  }

  return { packageData, files };
}

export function clientPresentationBasePath(pdfPath: string) {
  return pdfPath.replace(/\.pdf$/i, "");
}

export function siblingPackagePath(basePath: string, fileName: string) {
  const slash = Math.max(basePath.lastIndexOf("/"), basePath.lastIndexOf("\\"));
  const directory = slash >= 0 ? basePath.slice(0, slash + 1) : "";
  return `${directory}${fileName}`;
}

export function clientPresentationPackageDirectory(pdfPath: string) {
  return clientPresentationBasePath(pdfPath);
}

export function packageFilePath(packageDirectory: string, fileName: string) {
  const separator = packageDirectory.includes("\\") ? "\\" : "/";
  return `${packageDirectory.replace(/[\\/]+$/g, "")}${separator}${fileName}`;
}
