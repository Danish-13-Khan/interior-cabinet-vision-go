export function clientPreviewExportStatusMessage(
  hasHeroPng: boolean,
  acceptedStillsCount: number,
): string {
  if (acceptedStillsCount > 0) {
    return hasHeroPng
      ? "Client preview package exported (PDF, PNG, JSON, accepted stills)."
      : "Client preview package exported (PDF, JSON, accepted stills).";
  }
  return hasHeroPng
    ? "Client preview package exported to a folder (PDF, PNG, JSON)."
    : "Client preview package exported to a folder (PDF + JSON; render a package hero for an image).";
}
