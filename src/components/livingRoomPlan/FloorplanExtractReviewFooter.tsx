import {
  exportFloorplanBuilding,
  exportFloorplanGlb,
  wrapSingleFloorBuilding,
  type ExtractionResult,
  type PolygonGroup,
} from "../../domain/floorplanExtract";
import { FloorplanExtractPatchPanel } from "./FloorplanExtractPatchPanel";

type Props = {
  draft: ExtractionResult;
  busy: boolean;
  applyEnabled: boolean;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
  onApply: () => void;
  onDelete: (group: PolygonGroup, id: string) => void;
  onUpsertJson: (group: PolygonGroup, polygonJson: string) => void;
  onSetWallHeight: (heightM: number) => void;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function FloorplanExtractReviewFooter(props: Props) {
  const runExport = async (job: () => Promise<Blob>, name: string, fail: string) => {
    props.onBusy(true);
    try {
      downloadBlob(await job(), name);
    } catch (error) {
      props.onError(error instanceof Error ? error.message : fail);
    } finally {
      props.onBusy(false);
    }
  };

  return (
    <footer>
      <details data-testid="lr-floorplan-advanced-json">
        <summary>Advanced: draft JSON</summary>
        <FloorplanExtractPatchPanel
          draft={props.draft}
          busy={props.busy}
          onDelete={props.onDelete}
          onUpsertJson={props.onUpsertJson}
          onSetWallHeight={props.onSetWallHeight}
        />
      </details>
      <details data-testid="lr-floorplan-advanced-mesh">
        <summary>Preview mesh</summary>
        <button
          type="button"
          disabled={props.busy}
          onClick={() => void runExport(() => exportFloorplanGlb(props.draft), "floorplan-preview.glb", "GLB export failed.")}
        >
          Download GLB preview
        </button>
        <button
          type="button"
          disabled={props.busy}
          onClick={() => void runExport(
            () => exportFloorplanBuilding(wrapSingleFloorBuilding(props.draft)),
            "floorplan-building.glb",
            "Building export failed.",
          )}
        >
          Download building GLB
        </button>
      </details>
      <button
        type="button"
        data-testid="lr-floorplan-extract-apply"
        disabled={!props.applyEnabled || props.busy}
        title={!props.applyEnabled ? "Calibrate scale and pass Apply gates" : "Apply shell replacement"}
        onClick={props.onApply}
      >
        Apply to project (replace shell)
      </button>
    </footer>
  );
}
