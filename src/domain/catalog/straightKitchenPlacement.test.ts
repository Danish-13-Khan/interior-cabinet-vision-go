import { describe, expect, it } from "vitest";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
  pointInRoomPolygon,
  roomPlanPolygon,
} from "../interiorProject";
import { instantiateStraightKitchenCatalogTemplate } from ".";
import { adapterWallsForRooms } from "../interiorProject/cabinetAdapterWalls";

const NOW = "2026-09-05T00:00:00.000Z";
const APPLIANCES = [
  "kenney:kitchen-fridge",
  "kenney:kitchen-stove-electric",
  "kenney:kitchen-sink",
] as const;

describe("straight kitchen stays on the floor after adapter sync", () => {
  it("does not double catalog shell walls when projecting the cabinet adapter", () => {
    const fresh = instantiateStraightKitchenCatalogTemplate({ projectId: "sk-walls", now: NOW });
    const adapted = cabinetProjectFromInteriorProject(fresh);
    const rooms = adapted.project.rooms ?? [];
    const preserved = fresh.walls.filter((wall) => wall.roomId === rooms[0]?.id);
    expect(preserved.length).toBe(4);
    expect(adapterWallsForRooms(rooms, preserved)).toHaveLength(4);
  });

  it("keeps appliances inside the room polygon after editor round-trip", () => {
    const fresh = instantiateStraightKitchenCatalogTemplate({ projectId: "sk-floor", now: NOW });
    const adapted = cabinetProjectFromInteriorProject(fresh);
    const round = interiorProjectFromCabinetProject({
      project: adapted.project,
      activeRoom: adapted.room,
      now: NOW,
    });
    expect(round.walls).toHaveLength(4);
    const polygon = roomPlanPolygon(round, round.activeRoomId!);
    expect(polygon).toBeTruthy();
    const halfW = 6000 / 2;
    const halfD = 4000 / 2;
    const inset = 120;
    for (const id of APPLIANCES) {
      const object = round.objects.find((item) => item.catalogItemId === id)!;
      expect(pointInRoomPolygon({ x: object.position.x, z: object.position.z }, polygon!)).toBe(true);
      const hw = object.dimensions.widthMm / 2;
      const hd = object.dimensions.depthMm / 2;
      expect(object.position.x - hw).toBeGreaterThanOrEqual(-halfW + inset);
      expect(object.position.x + hw).toBeLessThanOrEqual(halfW - inset);
      expect(object.position.z - hd).toBeGreaterThanOrEqual(-halfD);
      expect(object.position.z + hd).toBeLessThanOrEqual(halfD);
    }
  });
});
