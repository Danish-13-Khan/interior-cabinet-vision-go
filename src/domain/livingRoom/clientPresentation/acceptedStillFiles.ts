import type { StillProvenance } from "../stillJob/provenance";

export type AcceptedStillPng = {
  fileName: string;
  dataUrl: string;
};

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

/** Attach accepted still PNGs only. Pending/rejected stills are ignored. */
export async function acceptedStillPngFiles(
  acceptedStills: StillProvenance[],
  pngs: AcceptedStillPng[],
) {
  const allowed = new Set(
    acceptedStills
      .filter((item) => item.acceptanceStatus === "accepted")
      .map((item) => item.stillOutputPath)
      .filter((path): path is string => Boolean(path)),
  );
  const files: { fileName: string; kind: "png"; contents: Blob }[] = [];
  for (const png of pngs) {
    if (!allowed.has(png.fileName)) continue;
    files.push({
      fileName: png.fileName,
      kind: "png",
      contents: await dataUrlToBlob(png.dataUrl),
    });
  }
  return files;
}
