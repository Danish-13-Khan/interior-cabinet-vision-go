import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { collectOpeningLeaves, resetOpeningIdCounterForTests, splitOpening } from "../cabinetOpeningStructure";
import { expandCabinetPieces } from "./pieces";

function cabinet(id: string, type: "base" | "drawer"): CabinetInstance {
  return {
    id,
    name: type,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    config: getDefaultCabinetConfig(type),
  };
}

describe("physical pieces", () => {
  it("gives each door leaf its own id on one cut-list line", () => {
    const pieces = expandCabinetPieces(cabinet("cab-base", "base"));
    const doors = pieces.filter((piece) => piece.pieceId.includes(":door:"));
    expect(doors.map((piece) => piece.pieceId)).toEqual([
      "cab-base:piece:opening-primary:door:1",
      "cab-base:piece:opening-primary:door:2",
    ]);
    expect(doors[0]?.cutlistKey).toBe(doors[1]?.cutlistKey);
    expect(doors[0]?.geometryNames).toEqual(["left-door"]);
    expect(doors[1]?.geometryNames).toEqual(["right-door"]);
  });

  it("keeps the original opening's piece ids after a split", () => {
    resetOpeningIdCounterForTests();
    const beforeCabinet = cabinet("cab-base", "base");
    const before = expandCabinetPieces(beforeCabinet);
    const composition = resolveCabinetComposition(beforeCabinet.config);
    const split = splitOpening(
      composition.openingStructure!,
      "opening-primary",
      "vertical",
      beforeCabinet.config.type,
      beforeCabinet.config.dimensions.width,
    );
    expect(collectOpeningLeaves(split.root).some((leaf) => leaf.stableId === "opening-primary")).toBe(true);
    const after = expandCabinetPieces({
      ...beforeCabinet,
      config: { ...beforeCabinet.config, composition: { ...composition, openingStructure: split } },
    });
    const shelfId = "cab-base:piece:opening-primary:shelf:1";
    const doorId = "cab-base:piece:opening-primary:door:1";
    expect(before.some((piece) => piece.pieceId === shelfId)).toBe(true);
    expect(after.some((piece) => piece.pieceId === shelfId)).toBe(true);
    expect(after.some((piece) => piece.pieceId === doorId)).toBe(true);
    expect(before.find((piece) => piece.pieceId === shelfId)?.cutlistKey).toBe("cab-base:shelf");
    expect(after.find((piece) => piece.pieceId === shelfId)?.cutlistKey).not.toBe("cab-base:shelf");
    expect(after.find((piece) => piece.pieceId === doorId)?.geometryNames).not.toEqual(["left-door"]);
    expect(after.some((piece) => piece.pieceId.includes(":door:") && !piece.pieceId.includes("opening-primary"))).toBe(true);
  });

  it("puts each drawer front with its own box parts", () => {
    const pieces = expandCabinetPieces(cabinet("cab-d", "drawer"));
    const fronts = pieces.filter((piece) => piece.pieceId.includes(":front:"));
    expect(fronts).toHaveLength(3);
    expect(new Set(fronts.map((piece) => piece.cutlistKey)).size).toBe(1);
    const first = pieces.filter((piece) => piece.drawerIndex === 1);
    expect(first.map((piece) => piece.pieceId)).toEqual([
      "cab-d:piece:opening-primary:drawer:1:front:1",
      "cab-d:piece:opening-primary:drawer:1:side:1",
      "cab-d:piece:opening-primary:drawer:1:side:2",
      "cab-d:piece:opening-primary:drawer:1:end:1",
      "cab-d:piece:opening-primary:drawer:1:end:2",
      "cab-d:piece:opening-primary:drawer:1:bottom:1",
    ]);
    expect(first.filter((piece) => piece.pieceId.includes(":side:")).every((piece) => piece.geometryNames.length === 0)).toBe(true);
  });
});
