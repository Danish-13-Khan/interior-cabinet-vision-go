import type { DoorSide, RoomConfig } from "../roomModel";
import type { ProjectRoom } from "../projectRooms";
import { selectOpeningsForRoom, selectWallsForRoom } from "./planTopology";
import { record } from "./cabinetAdapterShared";
import type {
  EntityExtensions,
  InteriorProject,
  InteriorRoomEntity,
  RoomType,
  WallEntity,
} from "./types";

export function roomType(room: ProjectRoom): RoomType {
  const saved = record(room.config)?.roomType;
  return typeof saved === "string" &&
    ["living-room", "bedroom", "bathroom", "kitchen", "office", "utility", "custom"].includes(saved)
    ? (saved as RoomType)
    : "custom";
}

export function wallSide(wall: WallEntity | undefined): DoorSide | null {
  const side = record(wall?.extensions)?.wallSide;
  return side === "back-wall" || side === "left-wall" || side === "right-wall" ? side : null;
}

export function sourceId(extensions: EntityExtensions | undefined, fallback: string) {
  const value = record(extensions)?.sourceId;
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function roomEntitiesFromProject(rooms: ProjectRoom[]): InteriorRoomEntity[] {
  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    roomType: roomType(room),
    dimensions: {
      widthMm: room.config.dimensions.widthMm,
      heightMm: room.config.dimensions.heightMm,
      depthMm: room.config.dimensions.depthMm,
    },
    wallThicknessMm: room.config.dimensions.wallThicknessMm,
    extensions: { managedBy: "interior-cabinet-adapter" },
  }));
}

export function roomConfigFromDocument(document: InteriorProject, room: InteriorRoomEntity): RoomConfig {
  const roomWalls = selectWallsForRoom(document, room.id);
  const sideVisibility = (side: DoorSide) =>
    roomWalls.find((wall) => wallSide(wall) === side)?.visible ?? true;
  const openings = selectOpeningsForRoom(document, room.id);
  return {
    dimensions: {
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
      wallThicknessMm: room.wallThicknessMm,
      showBackWall: sideVisibility("back-wall"),
      showLeftWall: sideVisibility("left-wall"),
      showRightWall: sideVisibility("right-wall"),
    },
    doors: openings
      .filter((opening) => opening.kind === "door")
      .flatMap((opening) => {
        const side = wallSide(roomWalls.find((wall) => wall.id === opening.wallId));
        return side
          ? [{
              id: sourceId(opening.extensions, opening.id),
              side,
              positionMm: opening.offsetMm,
              widthMm: opening.widthMm,
              heightMm: opening.heightMm,
              swingDirection: opening.swingDirection ?? "in" as const,
            }]
          : [];
      }),
    windows: openings
      .filter((opening) => opening.kind === "window")
      .flatMap((opening) => {
        const side = wallSide(roomWalls.find((wall) => wall.id === opening.wallId));
        return side
          ? [{
              id: sourceId(opening.extensions, opening.id),
              side,
              positionMm: opening.offsetMm,
              widthMm: opening.widthMm,
              heightMm: opening.heightMm,
              sillHeightMm: opening.sillHeightMm,
            }]
          : [];
      }),
  };
}
