import {
  buildProductionOutputsPackage,
  productionPackageSlug,
  serializeProductionOutputsPackage,
} from "../domain/productionOutputsPackage";
import type { MachineJobDocument } from "../domain/machineExport";
import type { ProjectReport } from "../domain/projectReport";
import { enqueueBrowserDownload } from "./browserDownloadQueue";
import { isTauriRuntime, promptSavePath, writeTextFile } from "./desktopFiles";

export async function downloadProductionOutputsPackage(
  report: ProjectReport,
  machineJob: MachineJobDocument | null,
) {
  const files = buildProductionOutputsPackage(report, machineJob);
  const slug = productionPackageSlug(report);
  if (isTauriRuntime()) {
    const path = await promptSavePath({
      title: "Download production outputs",
      defaultPath: `${slug}-production-outputs.txt`,
      extensions: ["txt"],
    });
    if (!path) return false;
    await writeTextFile(path, serializeProductionOutputsPackage(files));
    return true;
  }
  for (const file of files) {
    await enqueueBrowserDownload(
      new Blob([file.contents], { type: "text/csv;charset=utf-8" }),
      file.name,
    );
  }
  return true;
}
