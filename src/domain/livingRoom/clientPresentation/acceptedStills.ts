import type { StillProvenance } from "../stillJob/provenance";
import type { ClientPresentationManifest } from "./buildPackage";

/** Only accepted stills may be recorded on the client package manifest. */
export function withAcceptedStillProvenance(
  manifest: ClientPresentationManifest,
  stills: StillProvenance[],
): ClientPresentationManifest {
  const acceptedStills = stills.filter((item) => item.acceptanceStatus === "accepted");
  return {
    ...manifest,
    acceptedStills,
  };
}
