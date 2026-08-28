import type { LivingRoomRenderResult } from "../renderStudio";

export function clientPreviewExportStatusMessage(
  render: LivingRoomRenderResult | null,
  acceptedStillsCount: number,
): string {
  if (acceptedStillsCount > 0) {
    return render
      ? "Client preview package exported (PDF, PNG, JSON, accepted stills)."
      : "Client preview package exported (PDF, JSON, accepted stills).";
  }
  return render
    ? "Client preview package exported to a folder (PDF, PNG, JSON)."
    : "Client preview package exported to a folder (PDF + JSON; render a hero image for PNG).";
}
