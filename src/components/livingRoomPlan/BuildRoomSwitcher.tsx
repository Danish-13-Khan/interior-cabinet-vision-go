import { useEffect, useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";

type BuildRoomSwitcherProps = {
  rooms: Array<{ id: string; name: string }>;
  activeRoomId: string;
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  mergeableRoomIds?: string[];
  /** Adjacent rooms blocked from merge (e.g. hole topology) with a short reason. */
  mergeBlockedHint?: string | null;
};

type PendingConfirm =
  | { kind: "delete" }
  | { kind: "merge"; absorbedRoomId: string; absorbedName: string }
  | null;

/** Minimal multi-room chrome: switch active face and rename. */
export function BuildRoomSwitcher(props: BuildRoomSwitcherProps) {
  const active = props.rooms.find((room) => room.id === props.activeRoomId) ?? props.rooms[0];
  const [draftName, setDraftName] = useState(active?.name ?? "");
  const [pending, setPending] = useState<PendingConfirm>(null);
  useEffect(() => {
    setDraftName(active?.name ?? "");
  }, [active?.id, active?.name]);
  if (!active) return null;
  const mergeCandidates = props.rooms.filter((room) =>
    room.id !== active.id && (props.mergeableRoomIds ?? []).includes(room.id));

  function commitName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === active!.name) {
      setDraftName(active!.name);
      return;
    }
    props.onRenameRoom(active!.id, trimmed);
  }

  function requestDeleteActiveRoom() {
    if (props.rooms.length > 1) setPending({ kind: "delete" });
  }

  function requestMergeIntoActive(absorbedRoomId: string) {
    const absorbed = props.rooms.find((room) => room.id === absorbedRoomId);
    if (absorbed) {
      setPending({ kind: "merge", absorbedRoomId, absorbedName: absorbed.name });
    }
  }

  function closeConfirm() {
    setPending(null);
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === "delete") {
      props.onDeleteRoom?.(active!.id);
    } else {
      props.onMergeRooms?.(active!.id, pending.absorbedRoomId);
    }
    setPending(null);
  }

  const mergeHint = mergeCandidates.length === 0 && props.rooms.length > 1
    ? (props.mergeBlockedHint ?? "No adjacent room available to merge.")
    : null;

  return (
    <section className="lr-room-switcher" data-testid="build-room-switcher" aria-label="Rooms">
      <strong>Rooms</strong>
      <div className="lr-room-switcher-tabs" role="tablist" aria-label="Active room">
        {props.rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            role="tab"
            data-room-id={room.id}
            aria-selected={room.id === props.activeRoomId}
            className={room.id === props.activeRoomId ? "is-active" : ""}
            onClick={() => props.onActiveRoom(room.id)}
          >
            {room.name}
          </button>
        ))}
      </div>
      <label>
        <span>Name</span>
        <input
          data-testid="build-room-name"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </label>
      <div className="lr-room-switcher-actions">
        <button type="button" data-testid="build-room-delete" onClick={requestDeleteActiveRoom} disabled={props.rooms.length <= 1}>Delete room</button>
        {mergeCandidates.length > 0 ? (
          <label>
            <span>Merge into this room</span>
            <select
              data-testid="build-room-merge-select"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) requestMergeIntoActive(event.target.value);
                event.currentTarget.value = "";
              }}
            >
              <option value="" disabled>Choose adjacent room…</option>
              {mergeCandidates.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>
        ) : mergeHint ? (
          <small data-testid="build-room-merge-blocked" role="status">{mergeHint}</small>
        ) : null}
      </div>

      <ConfirmDialog
        open={pending?.kind === "delete"}
        title="Delete room?"
        message={`Delete ${active.name} and its contents? This cannot be undone from this dialog (use Undo after).`}
        confirmLabel="Delete room"
        danger
        testId="build-room-delete-confirm"
        onConfirm={confirmPending}
        onCancel={closeConfirm}
      />
      <ConfirmDialog
        open={pending?.kind === "merge"}
        title="Merge rooms?"
        message={
          pending?.kind === "merge"
            ? `Merge ${pending.absorbedName} into ${active.name}? The shared wall will be removed.`
            : ""
        }
        confirmLabel="Merge rooms"
        testId="build-room-merge-confirm"
        onConfirm={confirmPending}
        onCancel={closeConfirm}
      />
    </section>
  );
}
