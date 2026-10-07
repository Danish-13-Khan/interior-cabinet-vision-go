import type { InteriorProject } from "../domain/interiorProject";
import type { CyclesStillBundle } from "../domain/livingRoom";
import { exportCyclesBundleForProject } from "../rendering/stillEngine/cycles/exportCyclesBundle";
import { blobToDataUrl } from "../utils/dataUrl";
import { pickBrowserFile, promptSavePath, writeTextFile } from "./desktopFiles";

/**
 * Transport (b): the seat writes a job folder and a local Blender renders it with
 * `npm run cycles:render`. The still and its provenance come back through the
 * same file dialogs. In the browser build the bundle downloads and the picker is
 * a plain file input, so the flow works without a sidecar.
 */
export async function saveCyclesBundle(bundle: CyclesStillBundle): Promise<string | null> {
  const path = await promptSavePath({
    title: "Cycles photo job",
    defaultPath: `${bundle.job.jobId}.bundle.json`,
    extensions: ["json"],
  });
  if (!path) return null;
  await writeTextFile(path, `${JSON.stringify(bundle, null, 2)}\n`);
  return path;
}

export type CyclesStillFiles = {
  provenanceText: string;
  stillDataUrl: string;
};

/** Ask for provenance.json, then still.png. Returns null if either pick is cancelled. */
export async function pickCyclesStillFiles(): Promise<CyclesStillFiles | null> {
  const provenanceFile = await pickBrowserFile(".json,application/json");
  if (!provenanceFile) return null;
  const provenanceText = await provenanceFile.text();
  const stillFile = await pickBrowserFile(".png,image/png");
  if (!stillFile) return null;
  return { provenanceText, stillDataUrl: await blobToDataUrl(stillFile) };
}

/** Present-mode entry: export the photo job for the saved camera and render size. Never edits the project. */
export async function exportCyclesPhotoJob(project: InteriorProject): Promise<{ path: string | null; error: string | null }> {
  try {
    const bundle = exportCyclesBundleForProject(project);
    return { path: await saveCyclesBundle(bundle), error: null };
  } catch (caught) {
    return { path: null, error: caught instanceof Error ? caught.message : "Could not export the photo job." };
  }
}
