import { cabinetTypeLabels, type CabinetInstance } from "../domain/cabinetDimensions";
import { resolveCabinetComposition } from "../domain/cabinetComposition";
import { collectOpeningLeaves } from "../domain/cabinetOpeningStructure";
import type { CabinetRun } from "../domain/cabinetLibrary";
import { formatRunDraftLabel } from "../domain/runDrafting";
import type { ProjectRoom } from "../domain/projectRooms";
import { CONTENT_TYPE_LABELS } from "../domain/cabinetEditorSchema/helpers";

type WorkspaceSceneBrowserProps = {
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  cabinets: CabinetInstance[];
  runs: CabinetRun[];
  activeCabinetId: string | null;
  selectedCabinetIds: string[];
  activeOpeningId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectCabinet: (cabinetId: string, additive: boolean) => void;
  onSelectRun: (run: CabinetRun) => void;
  onSelectOpening: (cabinetId: string, openingId: string) => void;
};

export function WorkspaceSceneBrowser({
  rooms,
  activeRoomId,
  cabinets,
  runs,
  activeCabinetId,
  selectedCabinetIds,
  activeOpeningId,
  onSelectRoom,
  onSelectCabinet,
  onSelectRun,
  onSelectOpening,
}: WorkspaceSceneBrowserProps) {
  const activeCabinet =
    cabinets.find((cabinet) => cabinet.id === activeCabinetId) ?? null;
  const structure = activeCabinet
    ? resolveCabinetComposition(activeCabinet.config).openingStructure
    : null;
  const openingLeaves = structure ? collectOpeningLeaves(structure.root) : [];

  return (
    <aside className="workspace-scene-browser" aria-label="Scene browser">
      <div className="workspace-scene-browser-header">Objects</div>

      <section className="wsb-section">
        <div className="wsb-section-title">
          Rooms <span>{rooms.length}</span>
        </div>
        <div className="wsb-list">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`wsb-item ${activeRoomId === room.id ? "is-active" : ""}`}
              onClick={() => onSelectRoom(room.id)}
              title={room.name}
            >
              <strong>{room.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="wsb-section">
        <div className="wsb-section-title">
          Cabinets <span>{cabinets.length}</span>
        </div>
        <div className="wsb-list">
          {cabinets.map((cabinet) => {
            const selected = selectedCabinetIds.includes(cabinet.id);
            const active = activeCabinetId === cabinet.id;
            return (
              <button
                key={cabinet.id}
                type="button"
                className={`wsb-item ${selected ? "is-selected" : ""} ${active ? "is-active" : ""}`}
                onClick={(event) =>
                  onSelectCabinet(
                    cabinet.id,
                    event.metaKey || event.ctrlKey || event.shiftKey,
                  )
                }
                title={`${cabinet.name} · ${cabinetTypeLabels[cabinet.config.type]}`}
              >
                <strong>{cabinet.name}</strong>
                <small>{cabinetTypeLabels[cabinet.config.type]}</small>
              </button>
            );
          })}
          {cabinets.length === 0 ? (
            <p className="wsb-empty">No cabinets in room</p>
          ) : null}
        </div>
      </section>

      <section className="wsb-section">
        <div className="wsb-section-title">
          Runs <span>{runs.length}</span>
        </div>
        <div className="wsb-list">
          {runs.map((run, index) => (
            <button
              key={run.id}
              type="button"
              className="wsb-item"
              onClick={() => onSelectRun(run)}
              title={formatRunDraftLabel(run, index)}
            >
              <strong>{formatRunDraftLabel(run, index)}</strong>
              <small>{run.cabinetIds.length} cab</small>
            </button>
          ))}
          {runs.length === 0 ? <p className="wsb-empty">No runs</p> : null}
        </div>
      </section>

      <section className="wsb-section">
        <div className="wsb-section-title">
          Openings <span>{openingLeaves.length}</span>
        </div>
        <div className="wsb-list">
          {activeCabinet && openingLeaves.length > 0 ? (
            openingLeaves.map((leaf) => (
              <button
                key={leaf.id}
                type="button"
                className={`wsb-item ${activeOpeningId === leaf.id ? "is-active" : ""}`}
                onClick={() => onSelectOpening(activeCabinet.id, leaf.id)}
                title={`${leaf.label} · ${CONTENT_TYPE_LABELS[leaf.contentType]}`}
              >
                <strong>{leaf.label}</strong>
                <small>{CONTENT_TYPE_LABELS[leaf.contentType]}</small>
              </button>
            ))
          ) : (
            <p className="wsb-empty">
              {activeCabinet ? "No openings" : "Select a cabinet"}
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
