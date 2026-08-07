import { cabinetTypeLabels, type CabinetInstance } from "../domain/cabinetDimensions";

type SceneTreePanelProps = {
  cabinets: CabinetInstance[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onCabinetContextMenu?: (
    cabinetId: string,
    point: { x: number; y: number },
  ) => void;
};

export function SceneTreePanel({
  cabinets,
  activeCabinetId,
  selectedCabinetIds,
  onSelectCabinet,
  onCabinetContextMenu,
}: SceneTreePanelProps) {
  return (
    <div className="rail-section scene-tree-panel">
      <div className="rail-section-title">
        <span>Scene Objects</span>
        <span className="rail-count">{cabinets.length}</span>
      </div>
      <div className="scene-tree-list">
        {cabinets.map((cabinet) => {
          const isActive = activeCabinetId === cabinet.id;
          const isSelected = selectedCabinetIds.includes(cabinet.id);
          return (
            <button
              key={cabinet.id}
              type="button"
              className={`scene-tree-item ${isSelected ? "is-selected" : ""} ${isActive ? "is-active" : ""}`}
              onClick={(event) =>
                onSelectCabinet(
                  cabinet.id,
                  event.metaKey || event.ctrlKey || event.shiftKey,
                )
              }
              onContextMenu={(event) => {
                if (!onCabinetContextMenu) return;
                event.preventDefault();
                onCabinetContextMenu(cabinet.id, {
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
              title={`${cabinet.name} · ${cabinetTypeLabels[cabinet.config.type]}`}
            >
              <span className="scene-tree-icon">
                {cabinetTypeLabels[cabinet.config.type].charAt(0)}
              </span>
              <span className="scene-tree-copy">
                <strong>{cabinet.name}</strong>
                <small>{cabinetTypeLabels[cabinet.config.type]}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
