import { useState } from "react";
import { wallLengthMm } from "./proposalBounds";
import {
  updateRoomName,
  updateWallEndpoint,
  updateWallHeight,
} from "./proposalEdit";
import type { GeminiFloorProposal } from "./proposalTypes";
import { calibrateByWallLength } from "./scaleCalibration";

type Props = {
  proposal: GeminiFloorProposal;
  selectedWallId: string | null;
  selectedRoomId: string | null;
  onChange: (next: GeminiFloorProposal) => void;
  onSelectWall: (id: string) => void;
  onSelectRoom: (id: string) => void;
  calibrateError: string | null;
  onCalibrateError: (msg: string | null) => void;
};

export function ReviewEditorPanel({
  proposal,
  selectedWallId,
  selectedRoomId,
  onChange,
  onSelectWall,
  onSelectRoom,
  calibrateError,
  onCalibrateError,
}: Props) {
  const [knownMm, setKnownMm] = useState("");
  const wall = proposal.walls.find((w) => w.id === selectedWallId) ?? null;
  const room = proposal.rooms.find((r) => r.id === selectedRoomId) ?? null;
  const currentLen = wall ? Math.round(wallLengthMm(wall)) : null;

  function applyCalibration() {
    if (!wall) return;
    const result = calibrateByWallLength(proposal, wall.id, Number(knownMm));
    if (!result.ok) {
      onCalibrateError(result.error);
      return;
    }
    onCalibrateError(null);
    onChange(result.proposal);
  }

  return (
    <section className="gfl-panel gfl-review" aria-label="Proposal editors">
      <header className="gfl-panel__head">
        <h2>Edit proposal</h2>
        <p>Correct walls, names, height, and scale without re-running Vision.</p>
      </header>
      <div className="gfl-review__body">
        <label className="gfl-field">
          <span>Wall height (mm)</span>
          <input
            type="number"
            min={1}
            value={proposal.assumedWallHeightMm}
            onChange={(e) => onChange(updateWallHeight(proposal, Number(e.target.value)))}
          />
        </label>

        <label className="gfl-field">
          <span>Room</span>
          <select
            value={selectedRoomId ?? ""}
            onChange={(e) => onSelectRoom(e.target.value)}
          >
            <option value="">Select room…</option>
            {proposal.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.id}
              </option>
            ))}
          </select>
        </label>

        {room ? (
          <label className="gfl-field">
            <span>Room name</span>
            <input
              type="text"
              value={room.name ?? ""}
              onChange={(e) => onChange(updateRoomName(proposal, room.id, e.target.value))}
            />
          </label>
        ) : null}

        <label className="gfl-field">
          <span>Wall</span>
          <select
            value={selectedWallId ?? ""}
            onChange={(e) => onSelectWall(e.target.value)}
          >
            <option value="">Select wall…</option>
            {proposal.walls.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {Math.round(wallLengthMm(w))} mm
              </option>
            ))}
          </select>
        </label>

        {wall ? (
          <WallEndpointFields
            proposal={proposal}
            wallId={wall.id}
            ax={wall.a.x}
            ay={wall.a.y}
            bx={wall.b.x}
            by={wall.b.y}
            onChange={onChange}
          />
        ) : null}

        {wall ? (
          <>
            <label className="gfl-field">
              <span>Known length for {wall.id} (mm)</span>
              <input
                type="number"
                min={1}
                value={knownMm}
                placeholder={currentLen ? `current ${currentLen}` : "e.g. 3600"}
                onChange={(e) => setKnownMm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyCalibration();
                }}
              />
            </label>
            <button type="button" className="gfl-review__calibrate" onClick={applyCalibration}>
              Apply scale calibration
            </button>
            {calibrateError ? <p className="gfl-review__error">{calibrateError}</p> : null}
            {currentLen !== null ? (
              <p className="gfl-review__meta">Current wall length: {currentLen} mm</p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function WallEndpointFields(props: {
  proposal: GeminiFloorProposal;
  wallId: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  onChange: (next: GeminiFloorProposal) => void;
}) {
  const { proposal, wallId, ax, ay, bx, by, onChange } = props;
  return (
    <>
      <div className="gfl-field-row">
        <NumField
          label="A x"
          value={ax}
          onValue={(x) => onChange(updateWallEndpoint(proposal, wallId, "a", { x, y: ay }))}
        />
        <NumField
          label="A y"
          value={ay}
          onValue={(y) => onChange(updateWallEndpoint(proposal, wallId, "a", { x: ax, y }))}
        />
      </div>
      <div className="gfl-field-row">
        <NumField
          label="B x"
          value={bx}
          onValue={(x) => onChange(updateWallEndpoint(proposal, wallId, "b", { x, y: by }))}
        />
        <NumField
          label="B y"
          value={by}
          onValue={(y) => onChange(updateWallEndpoint(proposal, wallId, "b", { x: bx, y }))}
        />
      </div>
    </>
  );
}

function NumField(props: { label: string; value: number; onValue: (n: number) => void }) {
  return (
    <label className="gfl-field">
      <span>{props.label}</span>
      <input
        type="number"
        value={props.value}
        onChange={(e) => props.onValue(Number(e.target.value))}
      />
    </label>
  );
}
