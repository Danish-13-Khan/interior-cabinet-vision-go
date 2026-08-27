import { useEffect, useState } from "react";

type BuildRoomSwitcherProps = {
  rooms: Array<{ id: string; name: string }>;
  activeRoomId: string;
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
};

/** Minimal multi-room chrome: switch active face and rename. */
export function BuildRoomSwitcher(props: BuildRoomSwitcherProps) {
  const active = props.rooms.find((room) => room.id === props.activeRoomId) ?? props.rooms[0];
  const [draftName, setDraftName] = useState(active?.name ?? "");
  useEffect(() => {
    setDraftName(active?.name ?? "");
  }, [active?.id, active?.name]);
  if (!active) return null;

  function commitName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === active!.name) {
      setDraftName(active!.name);
      return;
    }
    props.onRenameRoom(active!.id, trimmed);
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
    </section>
  );
}
