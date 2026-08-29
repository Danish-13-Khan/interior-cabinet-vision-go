export function clientPreviewExportStatusMessage(
  hasHeroPng: boolean,
  acceptedStillsCount: number,
  scheduleLineCount: number,
): string {
  const scheduleNote = scheduleLineCount > 0
    ? `millwork schedule (${scheduleLineCount} piece${scheduleLineCount === 1 ? "" : "s"})`
    : "millwork schedule";
  if (acceptedStillsCount > 0) {
    return hasHeroPng
      ? `Client package exported (PDF, PNG, JSON, accepted stills, ${scheduleNote}).`
      : `Client package exported (PDF, JSON, accepted stills, ${scheduleNote}).`;
  }
  return hasHeroPng
    ? `Client package exported (PDF, PNG, JSON, ${scheduleNote}).`
    : `Client package exported (PDF, JSON, ${scheduleNote}; render a package hero for an image).`;
}
