import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomRenderResult } from "../../domain/livingRoom";
import type { useClientPresentationExport } from "../../hooks/useClientPresentationExport";
import { acceptedStillExportPayload, type AcceptedStillAsset } from "../../hooks/selectPackageAcceptedStillAssets";

type ClientExport = ReturnType<typeof useClientPresentationExport>;

export function RenderStudioExportActions({
  isRendering,
  latestResult,
  project,
  clientExport,
  clientPackageBlocked,
  stillsBusy,
  activeCameraReady,
  acceptedStills,
  onGenerateStill,
  onSaveImage,
}: {
  isRendering: boolean;
  latestResult: LivingRoomRenderResult | null;
  project: InteriorProject;
  clientExport: ClientExport;
  clientPackageBlocked: boolean;
  stillsBusy: boolean;
  activeCameraReady: boolean;
  acceptedStills: AcceptedStillAsset[];
  onGenerateStill: () => void;
  onSaveImage: () => void;
}) {
  return (
    <>
      <button type="button" onClick={onGenerateStill} disabled={stillsBusy || isRendering || !activeCameraReady}>
        {stillsBusy ? "Generating still…" : "Generate Still"}
      </button>
      <button type="button" onClick={onSaveImage} disabled={!latestResult || isRendering}>Export PNG</button>
      <button
        type="button"
        onClick={() => latestResult && void clientExport.exportPresentationPdf(project, latestResult)}
        disabled={!latestResult || isRendering || clientExport.busy}
      >
        {clientExport.busy ? "Exporting…" : "Create Proposal"}
      </button>
      <button
        type="button"
        title={clientPackageBlocked ? "Resolve layout conflicts and place millwork before export." : undefined}
        onClick={() => {
          if (clientPackageBlocked) return;
          const payload = acceptedStillExportPayload(acceptedStills);
          void clientExport.exportClientPreview(project, latestResult, payload.provenance, payload.pngs);
        }}
        disabled={isRendering || clientExport.busy || clientPackageBlocked}
      >
        {clientExport.busy ? "Packaging…" : "Download client pack"}
      </button>
    </>
  );
}
