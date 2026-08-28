import type { ClientPresentationManifest } from "./buildPackageTypes";
import type { InteriorProject } from "../../interiorProject";
import type { StillProvenance } from "../stillJob/provenance";
import { buildClientPackageViews } from "./buildPackageViews";

export function attachPackageViewsToManifest(
  manifest: ClientPresentationManifest,
  project: InteriorProject,
  acceptedStills: StillProvenance[],
  packageViewsFileName: string,
): ClientPresentationManifest {
  const packageViews = buildClientPackageViews(project, acceptedStills);
  if (!packageViews.length) {
    return { ...manifest, packageViews: [] };
  }
  const files = manifest.files.includes(packageViewsFileName)
    ? manifest.files
    : [...manifest.files, packageViewsFileName];
  return { ...manifest, packageViews, files };
}
