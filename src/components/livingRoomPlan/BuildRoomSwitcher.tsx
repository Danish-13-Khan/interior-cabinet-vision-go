import { useEffect, useState } from "react";

type BuildRoomSwitcherProps = {
  rooms: Array<{ id: string; name: string }>;
  activeRoomId: string;
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  mergeableRoomIds?: string[];
};

/** Minimal multi-room chrome: switch active face and rename. */
export function BuildRoomSwitcher(props: BuildRoomSwitcherProps) {
  const active = props.rooms.find((room) => room.id === props.activeRoomId) ?? props.rooms[0];
  const [draftName, setDraftName] = useState(active?.name ?? "");
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

  function deleteActiveRoom() {
    if (props.rooms.length > 1 && window.confirm(`Delete ${active!.name} and its contents?`)) {
      props.onDeleteRoom?.(active!.id);
    }
  }

  function mergeIntoActive(absorbedRoomId: string) {
    const absorbed = props.rooms.find((room) => room.id === absorbedRoomId);
    if (absorbed && window.confirm(`Merge ${absorbed.name} into ${active!.name}? The shared wall will be removed.`)) {
      props.onMergeRooms?.(active!.id, absorbedRoomId);
    }
  }

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
        <button type="button" onClick={deleteActiveRoom} disabled={props.rooms.length <= 1}>Delete room</button>
        {mergeCandidates.length > 0 ? (
          <label>
            <span>Merge into this room</span>
            <select defaultValue="" onChange={(event) => {
              if (event.target.value) mergeIntoActive(event.target.value);
              event.currentTarget.value = "";
            }}>
              <option value="" disabled>Choose adjacent room…</option>
              {mergeCandidates.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>
        ) : props.rooms.length > 1 ? <small>No adjacent room available to merge.</small> : null}
      </div>
    </section>
  );
}
