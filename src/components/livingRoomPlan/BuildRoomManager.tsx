import type { InteriorProject } from "../../domain/interiorProject";
import { BuildRoomSwitcher } from "./BuildRoomSwitcher";

type Props = {
  project: InteriorProject;
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
};

/** Room chrome derives merge choices from shared boundary walls, not room ordering. */
export function BuildRoomManager(props: Props) {
  const active = props.project.rooms.find((room) => room.id === props.project.activeRoomId);
  const activeLoop = props.project.loops.find((loop) => loop.id === active?.outerLoopId);
  const activeWallIds = new Set(activeLoop?.wallUses.map((use) => use.wallId) ?? []);
  const mergeableRoomIds = props.project.rooms.filter((room) => room.id !== active?.id).filter((room) => {
    const loop = props.project.loops.find((candidate) => candidate.id === room.outerLoopId);
    return loop?.wallUses.some((use) => activeWallIds.has(use.wallId));
  }).map((room) => room.id);
  return <BuildRoomSwitcher
    rooms={props.project.rooms.map((room) => ({ id: room.id, name: room.name }))}
    activeRoomId={props.project.activeRoomId}
    onActiveRoom={props.onActiveRoom}
    onRenameRoom={props.onRenameRoom}
    onDeleteRoom={props.onDeleteRoom}
    onMergeRooms={props.onMergeRooms}
    mergeableRoomIds={mergeableRoomIds}
  />;
}
