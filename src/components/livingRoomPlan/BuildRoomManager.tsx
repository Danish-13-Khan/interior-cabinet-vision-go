import type { InteriorProject } from "../../domain/interiorProject";
import { explainInteriorRoomMergeBlock } from "../../domain/interiorProject";
import { BuildRoomSwitcher } from "./BuildRoomSwitcher";

type Props = {
  project: InteriorProject;
  onActiveRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
};

function sharesWallWithActive(project: InteriorProject, activeWallIds: Set<string>, roomId: string) {
  const room = project.rooms.find((entry) => entry.id === roomId);
  const loop = project.loops.find((candidate) => candidate.id === room?.outerLoopId);
  return Boolean(loop?.wallUses.some((use) => activeWallIds.has(use.wallId)));
}

/** Room chrome derives merge choices from shared boundary walls, not room ordering. */
export function BuildRoomManager(props: Props) {
  const active = props.project.rooms.find((room) => room.id === props.project.activeRoomId);
  const activeLoop = props.project.loops.find((loop) => loop.id === active?.outerLoopId);
  const activeWallIds = new Set(activeLoop?.wallUses.map((use) => use.wallId) ?? []);
  const adjacentIds = props.project.rooms
    .filter((room) => room.id !== active?.id)
    .filter((room) => sharesWallWithActive(props.project, activeWallIds, room.id))
    .map((room) => room.id);

  const mergeableRoomIds: string[] = [];
  const blockedMessages: string[] = [];
  for (const roomId of adjacentIds) {
    if (!active) break;
    const block = explainInteriorRoomMergeBlock(props.project, active.id, roomId);
    if (!block) {
      mergeableRoomIds.push(roomId);
      continue;
    }
    if (block.code === "hole-topology") {
      blockedMessages.push(block.message);
    }
  }

  const mergeBlockedHint = mergeableRoomIds.length === 0
    ? (blockedMessages[0]
      ?? (adjacentIds.length > 0
        ? "Adjacent rooms cannot be merged with the current topology. Fix walls or remove holes, then try again."
        : null))
    : null;

  return <BuildRoomSwitcher
    rooms={props.project.rooms.map((room) => ({ id: room.id, name: room.name }))}
    activeRoomId={props.project.activeRoomId}
    onActiveRoom={props.onActiveRoom}
    onRenameRoom={props.onRenameRoom}
    onDeleteRoom={props.onDeleteRoom}
    onMergeRooms={props.onMergeRooms}
    mergeableRoomIds={mergeableRoomIds}
    mergeBlockedHint={mergeBlockedHint}
  />;
}
