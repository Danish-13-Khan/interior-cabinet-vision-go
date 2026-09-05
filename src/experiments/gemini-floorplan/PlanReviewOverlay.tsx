import { proposalViewBox } from "./proposalBounds";
import type { GeminiFloorProposal } from "./proposalTypes";

type Props = {
  proposal: GeminiFloorProposal | null;
  previewUrl: string | null;
  selectedWallId: string | null;
  selectedRoomId: string | null;
  onSelectWall: (id: string) => void;
  onSelectRoom: (id: string) => void;
};

export function PlanReviewOverlay({
  proposal,
  previewUrl,
  selectedWallId,
  selectedRoomId,
  onSelectWall,
  onSelectRoom,
}: Props) {
  const viewBox = proposal ? proposalViewBox(proposal) : null;
  const low = proposal?.scaleConfidence === "low";

  return (
    <section className="gfl-panel gfl-overlay" aria-label="Plan review overlay">
      <header className="gfl-panel__head">
        <h2>Review overlay</h2>
        <p>Walls and rooms on the plan. Click a wall or room to edit.</p>
      </header>
      <div className={`gfl-overlay__stage${low ? " gfl-overlay__stage--low" : ""}`}>
        {previewUrl ? (
          <img className="gfl-overlay__img" src={previewUrl} alt="Floor plan underlay" />
        ) : (
          <div className="gfl-overlay__empty" aria-hidden />
        )}
        {proposal && viewBox ? (
          <svg className="gfl-overlay__svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
            {proposal.rooms.map((room) => {
              const d =
                room.outlineMm.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") +
                " Z";
              const selected = room.id === selectedRoomId;
              return (
                <path
                  key={room.id}
                  d={d}
                  className={selected ? "gfl-room gfl-room--selected" : "gfl-room"}
                  onClick={() => onSelectRoom(room.id)}
                />
              );
            })}
            {proposal.walls.map((wall) => {
              const selected = wall.id === selectedWallId;
              return (
                <g key={wall.id} onClick={() => onSelectWall(wall.id)}>
                  <line
                    x1={wall.a.x}
                    y1={wall.a.y}
                    x2={wall.b.x}
                    y2={wall.b.y}
                    className={selected ? "gfl-wall gfl-wall--selected" : "gfl-wall"}
                  />
                  {selected ? (
                    <>
                      <circle cx={wall.a.x} cy={wall.a.y} r="40" className="gfl-handle" />
                      <circle cx={wall.b.x} cy={wall.b.y} r="40" className="gfl-handle" />
                    </>
                  ) : null}
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="gfl-overlay__hint">Load a proposal to review geometry.</p>
        )}
      </div>
    </section>
  );
}
