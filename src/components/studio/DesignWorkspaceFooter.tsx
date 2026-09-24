import { designViewToolIds, type DesignWorkspaceView } from "../../domain/studio/designContext";
import { designFooterStatus, nextSnapSizeMm } from "../../domain/studio/designFooter";

export function DesignWorkspaceFooter(props: {
  view: DesignWorkspaceView;
  snapSizeMm: number;
  showGrid: boolean;
  selectedCount: number;
  issues: readonly { severity: "error" | "warning" }[];
  onSnapSize: (value: number) => void;
  onShowGrid: (value: boolean) => void;
  onView: (view: DesignWorkspaceView) => void;
  onFitPlan?: () => void;
  onFitSelection?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}) {
  const viewLabel = props.view === "model" ? "3D model" : props.view === "render" ? "Render" : "2D plan";
  const status = designFooterStatus({
    snapSizeMm: props.snapSizeMm,
    gridOn: props.showGrid,
    viewLabel,
    selectedCount: props.selectedCount,
    issues: props.issues,
  });
  const tools = designViewToolIds(props.view);
  const showSnap = tools.includes("snap") || tools.includes("grid");

  return (
    <footer className="studio-design-footer" data-testid="studio-design-footer">
      <span>Millimetres</span>
      <span className="studio-footer-zoom">
        Zoom
        <button type="button" aria-label="Zoom out" onClick={() => props.onZoomOut?.()}>−</button>
        <button type="button" aria-label="Zoom in" onClick={() => props.onZoomIn?.()}>+</button>
        {props.view === "plan" ? (
          <button type="button" onClick={() => props.onFitPlan?.()}>Fit</button>
        ) : (
          <button type="button" onClick={() => props.onFitSelection?.()} disabled={props.selectedCount < 1}>Fit</button>
        )}
      </span>
      {showSnap ? (
        <button type="button" aria-pressed={props.showGrid} onClick={() => {
          if (!props.showGrid) props.onShowGrid(true);
          else props.onSnapSize(nextSnapSizeMm(props.snapSizeMm));
        }}>
          Snap {props.showGrid ? "on" : "off"} · {status.snap}
        </button>
      ) : <span>Snap {status.snap}</span>}
      <span>Selection {status.selection}</span>
      <span className={props.issues.length ? "is-warn" : ""}>{status.warnings}</span>
    </footer>
  );
}
