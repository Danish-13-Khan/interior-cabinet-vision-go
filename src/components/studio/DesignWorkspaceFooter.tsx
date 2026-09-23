import { designViewToolIds, type DesignWorkspaceView } from "../../domain/studio/designContext";
import { designFooterStatus, nextSnapSizeMm } from "../../domain/studio/designFooter";

const TOOL_LABELS: Record<string, string> = {
  grid: "Grid",
  snap: "Snap",
  "fit-plan": "Fit",
  "fit-selection": "Fit selection",
  "zoom-in": "Zoom in",
  "zoom-out": "Zoom out",
  plan: "2D",
  model: "3D",
};

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

  function run(id: string) {
    if (id === "grid") props.onShowGrid(!props.showGrid);
    if (id === "snap") props.onSnapSize(nextSnapSizeMm(props.snapSizeMm));
    if (id === "fit-plan") props.onFitPlan?.();
    if (id === "fit-selection") props.onFitSelection?.();
    if (id === "zoom-in") props.onZoomIn?.();
    if (id === "zoom-out") props.onZoomOut?.();
    if (id === "plan") props.onView("plan");
    if (id === "model") props.onView("model");
  }

  return (
    <footer className="studio-design-footer" data-testid="studio-design-footer">
      <span>Units {status.units}</span>
      <span>Snap {status.snap}</span>
      <span>Zoom {status.zoom}</span>
      <span>Selection {status.selection}</span>
      <span className={props.issues.length ? "is-warn" : ""}>{status.warnings}</span>
      <div className="studio-design-tools" role="toolbar" aria-label="View tools">
        {tools.map((id) => (
          <button key={id} type="button" className="studio-btn" onClick={() => run(id)}>
            {TOOL_LABELS[id] ?? id}
          </button>
        ))}
      </div>
    </footer>
  );
}
