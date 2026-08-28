import type { InteriorProject } from "../domain/interiorProject";
import { filterPackageEligibleStills, type StillProvenance } from "../domain/livingRoom";

export type AcceptedStillAsset = {
  provenance: StillProvenance;
  stillDataUrl: string;
};

export function selectPackageAcceptedStillAssets(
  project: InteriorProject,
  acceptedStills: AcceptedStillAsset[],
): AcceptedStillAsset[] {
  const eligible = new Set(
    filterPackageEligibleStills(
      project,
      acceptedStills.map((item) => item.provenance),
    ).map((item) => item.jobId),
  );
  return acceptedStills.filter((item) => eligible.has(item.provenance.jobId));
}
