import type { CabinetGroup, CabinetLayer } from "../../domain/cabinetDimensions";

type AlignMode =
  | "align-left"
  | "align-center-x"
  | "align-right"
  | "align-top"
  | "align-center-z"
  | "align-bottom"
  | "distribute-x"
  | "distribute-z";

export function WorkflowSection({
  selectedCabinetIds,
  selectedLayerId,
  selectedGroupId,
  layers,
  groups,
  onAssignLayer,
  onCreateLayer,
  onCreateGroup,
  onClearGroup,
  onAlignSelection,
}: {
  selectedCabinetIds: string[];
  selectedLayerId: string;
  selectedGroupId: string | null;
  layers: CabinetLayer[];
  groups: CabinetGroup[];
  onAssignLayer: (layerId: string) => void;
  onCreateLayer: () => void;
  onCreateGroup: () => void;
  onClearGroup: () => void;
  onAlignSelection: (mode: AlignMode) => void;
}) {
  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Workflow</h2>
        <span>{selectedCabinetIds.length} selected</span>
      </div>

      <div className="field-grid">
        <div className="field-group">
          <label htmlFor="layer-select">Layer</label>
          <select
            id="layer-select"
            value={selectedLayerId}
            onChange={(event) => onAssignLayer(event.currentTarget.value)}
          >
            {layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="group-status">Group</label>
          <input
            id="group-status"
            type="text"
            value={selectedGroupId ? groups.find((group) => group.id === selectedGroupId)?.name ?? "Grouped" : "None"}
            readOnly
          />
        </div>
      </div>

      <div className="project-actions">
        <button type="button" onClick={onCreateLayer}>
          New Layer
        </button>
        <button type="button" onClick={onCreateGroup} disabled={selectedCabinetIds.length < 2}>
          Group
        </button>
        <button type="button" onClick={onClearGroup} disabled={selectedCabinetIds.length === 0}>
          Ungroup
        </button>
      </div>

      <div className="project-actions">
        <button type="button" onClick={() => onAlignSelection("align-left")} disabled={selectedCabinetIds.length < 2}>
          Align Left
        </button>
        <button type="button" onClick={() => onAlignSelection("align-center-x")} disabled={selectedCabinetIds.length < 2}>
          Center X
        </button>
        <button type="button" onClick={() => onAlignSelection("align-top")} disabled={selectedCabinetIds.length < 2}>
          Align Top
        </button>
        <button type="button" onClick={() => onAlignSelection("distribute-x")} disabled={selectedCabinetIds.length < 3}>
          Distribute X
        </button>
      </div>
    </div>
  );
}
