import {
  exportFloorplanBuilding,
  exportFloorplanGlb,
  wrapSingleFloorBuilding,
  type ExtractionResult,
} from "../../domain/floorplanExtract";
import { enqueueBrowserDownload } from "../../platform/browserDownloadQueue";

type Props = {
  draft: ExtractionResult;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
};

export function FloorplanExtractDownloads({ draft, busy, onBusy, onError }: Props) {
  const run = async (build: () => Promise<Blob>, fileName: string, fallback: string) => {
    onBusy(true);
    onError("");
    try {
      await enqueueBrowserDownload(await build(), fileName);
    } catch (error) {
      onError(error instanceof Error ? error.message : fallback);
    } finally {
      onBusy(false);
    }
  };

  return <>
    <button type="button" disabled={busy}
      onClick={() => void run(() => exportFloorplanGlb(draft), "floorplan-preview.glb", "GLB export failed.")}>
      {busy ? "Exporting…" : "Download GLB preview"}
    </button>
    <button type="button" disabled={busy}
      onClick={() => void run(
        () => exportFloorplanBuilding(wrapSingleFloorBuilding(draft)), "floorplan-building.glb", "Building export failed.",
      )}>
      Download building GLB
    </button>
  </>;
}
