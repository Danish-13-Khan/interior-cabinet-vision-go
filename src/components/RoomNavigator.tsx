import { useState } from "react";
import type { ProjectRoom } from "../domain/projectRooms";
import { ROOM_TEMPLATES, type RoomTemplateId } from "../domain/projectRooms";
import { ConfirmDialog } from "./ConfirmDialog";
import { PromptDialog } from "./PromptDialog";

type RoomNavigatorProps = {
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onDuplicateRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onRemoveRoom: (roomId: string) => void;
  onAddFromTemplate: (templateId: RoomTemplateId) => void;
};

export function RoomNavigator({
  rooms,
  activeRoomId,
  onSelectRoom,
  onAddRoom,
  onDuplicateRoom,
  onRenameRoom,
  onRemoveRoom,
  onAddFromTemplate,
}: RoomNavigatorProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const pendingRoom = rooms.find((room) => room.id === pendingDeleteId);
  const renameRoom = rooms.find((room) => room.id === pendingRenameId);

  return (
    <div className="rail-section room-navigator">
      <div className="rail-section-title">
        <span>Rooms</span>
        <span className="rail-count">{rooms.length}</span>
      </div>

      <div className="room-nav-list">
        {rooms.map((room) => {
          const isActive = room.id === activeRoomId;
          return (
            <div
              key={room.id}
              className={`room-nav-row ${isActive ? "is-active" : ""}`}
            >
              <button
                type="button"
                className="room-nav-select"
                onClick={() => onSelectRoom(room.id)}
                title={`${room.name} · ${room.cabinets.length} items`}
              >
                <strong>{room.name}</strong>
                <span>
                  {room.cabinets.length} items · {room.config.dimensions.widthMm}×
                  {room.config.dimensions.depthMm}
                </span>
              </button>
              <div className="room-nav-actions">
                <button
                  type="button"
                  className="room-nav-icon-btn"
                  title="Rename room"
                  data-testid={`room-nav-rename-${room.id}`}
                  onClick={() => setPendingRenameId(room.id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="room-nav-icon-btn"
                  title="Duplicate room"
                  onClick={() => onDuplicateRoom(room.id)}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="room-nav-icon-btn"
                  title="Delete room"
                  data-testid={`room-nav-delete-${room.id}`}
                  disabled={rooms.length <= 1}
                  onClick={() => setPendingDeleteId(room.id)}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="room-nav-toolbar">
        <button type="button" className="tb-btn" onClick={onAddRoom}>
          Add Room
        </button>
      </div>

      <div className="palette-section-label">Room Templates</div>
      <div className="library-item-list">
        {ROOM_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            className="library-item-btn"
            title={template.description}
            onClick={() => onAddFromTemplate(template.id)}
          >
            <strong>{template.label}</strong>
            <span>{template.description}</span>
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingRoom)}
        title="Delete room?"
        message={`Delete ${pendingRoom?.name ?? "this room"} and its cabinets?`}
        confirmLabel="Delete room"
        danger
        testId="room-nav-delete"
        onConfirm={() => {
          if (pendingDeleteId) onRemoveRoom(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
      <PromptDialog
        open={Boolean(renameRoom)}
        title="Rename room"
        label="Room name"
        initialValue={renameRoom?.name ?? "Room"}
        confirmLabel="Rename"
        testId="room-nav-rename"
        onConfirm={(name) => {
          if (pendingRenameId) onRenameRoom(pendingRenameId, name);
          setPendingRenameId(null);
        }}
        onCancel={() => setPendingRenameId(null)}
      />
    </div>
  );
}
