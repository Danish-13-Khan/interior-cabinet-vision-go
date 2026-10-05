import { describe, expect, it } from "vitest";
import { roomPlanViewBounds, type InteriorProject } from "../interiorProject";
import { roomIdsUsingWall } from "../interiorProject/planTopology";
import {
  APARTMENT_SHELL_SPECS,
  ONE_BHK_SHELL_SPEC,
  THREE_BHK_SHELL_SPEC,
  TWO_BHK_SHELL_SPEC,
  buildApartmentShell,
} from "./index";
import { roomAreaM2, roomIdByKey } from "./testSupport";

const NOW = "2026-10-05T00:00:00.000Z";

/** Room-key pairs joined by a door or arch (windows excluded). */
function passages(project: InteriorProject): Array<[string, string]> {
  const keyOf = new Map(project.rooms.map((room) => [
    room.id, String(room.extensions?.apartmentRoomKey ?? ""),
  ]));
  return project.openings
    .filter((opening) => opening.kind !== "window")
    .map((opening) => roomIdsUsingWall(project, opening.wallId).map((id) => keyOf.get(id)!))
    .filter((pair): pair is [string, string] => pair.length === 2);
}

function neighbours(project: InteriorProject, key: string): string[] {
  return passages(project)
    .filter((pair) => pair.includes(key))
    .map(([a, b]) => (a === key ? b : a))
    .sort();
}

function shell(spec: (typeof APARTMENT_SHELL_SPECS)[number]) {
  const project = buildApartmentShell(spec, { now: NOW });
  const ids = roomIdByKey(project);
  const area = (key: string) => roomAreaM2(project, ids.get(key)!);
  const minSide = (key: string) => {
    const bounds = roomPlanViewBounds(project, ids.get(key)!);
    return Math.min(bounds.widthMm, bounds.depthMm);
  };
  return { project, area, minSide, near: (key: string) => neighbours(project, key) };
}

describe("settled apartment shell layouts", () => {
  it("every room is reachable from the entry through doors/arches", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const { project, near } = shell(spec);
      const entry = spec.openings.find((item) =>
        item.kind === "door" && !Array.isArray(item.between))!;
      expect(entry, spec.id).toBeTruthy();
      const start = (entry.between as { room: string }).room;
      const seen = new Set([start]);
      const queue = [start];
      while (queue.length) {
        for (const next of near(queue.shift()!)) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect([...seen].sort(), spec.id).toEqual(spec.rooms.map((room) => room.key).sort());
      expect(project.rooms).toHaveLength(spec.rooms.length);
    }
  });

  it("1 BHK: utility opens off the kitchen, bath opens off the bedroom", () => {
    const { near } = shell(ONE_BHK_SHELL_SPEC);
    expect(near("utility")).toEqual(["kitchen"]);
    expect(near("bath")).toEqual(["bedroom"]);
    expect(near("bedroom")).toEqual(["bath", "living"]);
  });

  it("2 BHK: master suite is not smaller than kids; compact master bath + walk-in", () => {
    const { area, near } = shell(TWO_BHK_SHELL_SPEC);
    expect(area("master")).toBeGreaterThanOrEqual(area("kids"));
    expect(area("master-bath")).toBeLessThanOrEqual(5);
    expect(near("master-bath")).toEqual(["master"]);
    expect(near("walk-in")).toEqual(["master"]);
    expect(near("kids")).toEqual(["hall"]);
  });

  it("3 BHK: foyer meets living, bedrooms off a passage, toned-down bath/balcony", () => {
    const { area, minSide, near } = shell(THREE_BHK_SHELL_SPEC);
    expect(near("foyer")).toContain("living");
    expect(near("living")).toContain("passage");
    for (const key of ["kids", "guest", "master", "common-bath"]) {
      expect(near(key), key).toContain("passage");
    }
    expect(minSide("guest")).toBeGreaterThanOrEqual(3000);
    expect(area("master")).toBeGreaterThanOrEqual(area("kids"));
    expect(area("master")).toBeGreaterThanOrEqual(area("guest"));
    expect(area("master-bath")).toBeLessThanOrEqual(5);
    expect(area("balcony")).toBeLessThanOrEqual(8);
    expect(near("master-bath")).toEqual(["master"]);
    expect(near("guest-bath")).toEqual(["guest"]);
  });

  it("bedrooms are at least 2700 mm on their short side", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const { minSide } = shell(spec);
      for (const room of spec.rooms.filter((item) => item.roomType === "bedroom")) {
        expect(minSide(room.key), `${spec.id} ${room.key}`).toBeGreaterThanOrEqual(2700);
      }
    }
  });
});
