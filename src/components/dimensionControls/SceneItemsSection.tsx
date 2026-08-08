import { useState } from "react";
import {
  cabinetTypeLabels,
  type CabinetInstance,
} from "../../domain/cabinetDimensions";

export function SceneItemsSection({
  cabinetCount,
  cabinets,
  selectedCabinetIds,
  onSelectCabinet,
  onRenameCabinet,
  onUndo,
  onRedo,
  onCopySelection,
  onPasteSelection,
  onSelectAll,
  onDuplicateCabinet,
  onRemoveCabinet,
}: {
  cabinetCount: number;
  cabinets: CabinetInstance[];
  selectedCabinetIds: string[];
  onSelectCabinet: (cabinetId: string, additive?: boolean) => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopySelection: () => void;
  onPasteSelection: () => void;
  onSelectAll: () => void;
  onDuplicateCabinet: () => void;
  onRemoveCabinet: () => void;
}) {
  const [editCabinetNameId, setEditCabinetNameId] = useState<string | null>(null);
  const [editCabinetNameValue, setEditCabinetNameValue] = useState("");

  function handleStartRenameCabinet(cabinetId: string) {
    const cabinet = cabinets.find((c) => c.id === cabinetId);
    if (cabinet) {
      setEditCabinetNameId(cabinetId);
      setEditCabinetNameValue(cabinet.name);
    }
  }

  function handleFinishRenameCabinet(cabinetId: string) {
    if (editCabinetNameValue.trim()) {
      onRenameCabinet(cabinetId, editCabinetNameValue.trim());
    }
    setEditCabinetNameId(null);
    setEditCabinetNameValue("");
  }

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Scene Items</h2>
        <span>{cabinetCount} items</span>
      </div>

      <div className="cabinet-list">
        {cabinets.map((cabinet) => {
          const isEditing = editCabinetNameId === cabinet.id;
          return (
            <div
              key={cabinet.id}
              className={`cabinet-list-item ${selectedCabinetIds.includes(cabinet.id) ? "active" : ""}`}
              onClick={(event) =>
                onSelectCabinet(
                  cabinet.id,
                  event.metaKey || event.ctrlKey || event.shiftKey,
                )}
            >
              <span className="cabinet-list-icon">
                {cabinetTypeLabels[cabinet.config.type].charAt(0)}
              </span>
              {isEditing ? (
                <input
                  className="cabinet-name-edit"
                  value={editCabinetNameValue}
                  onChange={(e) => setEditCabinetNameValue(e.target.value)}
                  onBlur={() => handleFinishRenameCabinet(cabinet.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinishRenameCabinet(cabinet.id);
                    if (e.key === "Escape") {
                      setEditCabinetNameId(null);
                      setEditCabinetNameValue("");
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="cabinet-list-name"
                  onDoubleClick={() => handleStartRenameCabinet(cabinet.id)}
                  title="Double-click to rename"
                >
                  {cabinet.name}
                </span>
              )}
              <span className="cabinet-list-type">
                {cabinetTypeLabels[cabinet.config.type]}
              </span>
              {cabinet.groupId ? <span className="cabinet-list-type">Grouped</span> : null}
            </div>
          );
        })}
      </div>

      <div className="project-actions">
        <button type="button" onClick={onUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo}>
          Redo
        </button>
      </div>

      <div className="project-actions">
        <button type="button" onClick={onCopySelection} disabled={selectedCabinetIds.length === 0}>
          Copy
        </button>
        <button type="button" onClick={onPasteSelection}>
          Paste
        </button>
        <button type="button" onClick={onSelectAll}>
          Select All
        </button>
      </div>

      <div className="project-actions">
        <button type="button" onClick={onDuplicateCabinet} disabled={selectedCabinetIds.length === 0}>
          Duplicate
        </button>
        <button
          type="button"
          onClick={onRemoveCabinet}
          disabled={selectedCabinetIds.length === 0 || cabinets.length <= 1}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
