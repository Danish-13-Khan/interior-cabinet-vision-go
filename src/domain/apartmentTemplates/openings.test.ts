import { describe, expect, it } from "vitest";
import { roomIdsUsingWall } from "../interiorProject/planTopology";
import {
  APARTMENT_SHELL_SPECS,
  ONE_BHK_SHELL_SPEC,
  apartmentIdFactory,
  buildApartmentShell,
} from "./index";
import { storedOffsetFromFixedEnd } from "./openings";
import {
  openingWorldSpan,
  perpendicularHalfThickness,
  roomIdByKey,
} from "./testSupport";

const NOW = "2026-10-05T00:00:00.000Z";

describe("apartment opening offsets (fixed end)", () => {
  it("places every authored opening from the wall's lower x/z end in world space", () => {
    let reversedWalls = 0;
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      const ids = apartmentIdFactory(spec.id);
      spec.openings.forEach((authored, index) => {
        const placed = project.openings.find((item) => item.id === ids("opening", `o${index}`))!;
        const label = `${spec.id} opening #${index}`;
        expect(placed, label).toBeTruthy();
        expect(placed.widthMm, label).toBe(authored.widthMm);
        const span = openingWorldSpan(project, placed);
        expect(span.loMm, label).toBeCloseTo(authored.offsetMm, 0);
        expect(span.hiMm - span.loMm, label).toBeCloseTo(authored.widthMm, 0);
        const { start, end } = span.wall;
        if (start.x > end.x + 0.5 || (Math.abs(start.x - end.x) <= 0.5 && start.z > end.z)) {
          reversedWalls += 1;
          expect(placed.offsetMm, `${label} stored offset mirrored`)
            .toBeCloseTo(span.lengthMm - authored.offsetMm - authored.widthMm, 0);
        }
      });
    }
    // Guard: the shells must exercise high→low stored walls or this test proves nothing.
    expect(reversedWalls).toBeGreaterThan(3);
  });

  it("1 BHK entry door sits 400 mm from the north end of a south→north stored wall", () => {
    const project = buildApartmentShell(ONE_BHK_SHELL_SPEC, { now: NOW });
    const living = roomIdByKey(project).get("living")!;
    const entryIndex = ONE_BHK_SHELL_SPEC.openings.findIndex((item) =>
      !Array.isArray(item.between) && item.between.side === "west");
    const door = project.openings.find((item) =>
      item.id === apartmentIdFactory(ONE_BHK_SHELL_SPEC.id)("opening", `o${entryIndex}`))!;
    const span = openingWorldSpan(project, door);
    expect(span.wall.start.z).toBeGreaterThan(span.wall.end.z);
    expect(roomIdsUsingWall(project, door.wallId)).toEqual([living]);
    // Living spans z −650…3350 on the centreline.
    expect(span.worldLoMm).toBeCloseTo(-250, 0);
    expect(span.worldHiMm).toBeCloseTo(650, 0);
  });

  it("every opening clears the partitions/corners at both ends of its wall piece", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      for (const opening of project.openings) {
        const span = openingWorldSpan(project, opening);
        const lowClear = perpendicularHalfThickness(project, span.wall, span.lowNodeId);
        const highClear = perpendicularHalfThickness(project, span.wall, span.highNodeId);
        const label = `${spec.id} ${opening.id}`;
        expect(span.loMm, label).toBeGreaterThanOrEqual(lowClear);
        expect(span.hiMm, label).toBeLessThanOrEqual(span.lengthMm - highClear);
      }
    }
  });

  it("partitions use the spec internal thickness; the perimeter stays external", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const project = buildApartmentShell(spec, { now: NOW });
      for (const wall of project.walls) {
        const shared = roomIdsUsingWall(project, wall.id).length > 1;
        expect(wall.thicknessMm, `${spec.id} ${wall.id}`).toBe(
          shared ? spec.shell.internalWallMm : spec.shell.externalWallMm,
        );
      }
    }
  });

  it("storedOffsetFromFixedEnd mirrors only high→low walls", () => {
    const base = {
      id: "w", roomId: null, heightMm: 2850, thicknessMm: 115, visible: true, materialId: null,
    };
    const lowToHigh = { ...base, start: { x: 0, z: 0 }, end: { x: 3000, z: 0 } };
    const highToLow = { ...base, start: { x: 0, z: 3000 }, end: { x: 0, z: 0 } };
    expect(storedOffsetFromFixedEnd(lowToHigh, 400, 900)).toBe(400);
    expect(storedOffsetFromFixedEnd(highToLow, 400, 900)).toBe(1700);
  });
});
