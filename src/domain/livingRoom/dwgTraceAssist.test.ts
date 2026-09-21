import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { drawRoomFromPoints } from "../interiorProject";
import { parseAsciiDxf } from "./dwgDxfParse";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { cadToPlanPoint } from "./dwgPlanMap";
import { collectDwgPlanEndpoints, snapPlanPointToDwg } from "./dwgPlanSnap";
import { suggestRoomPolygonFromDwg } from "./dwgSuggestRoom";
import { placeRecognizedDwgCabinets, recognizedCabinetInserts } from "./dwgCabinetBlocks";
import { applyPlannerStarterTemplate } from "./plannerStarters";
import { createLivingRoomStarterProject } from "./preset";
import { setLivingRoomPlanUnderlay, type LivingRoomPlanUnderlay } from "./planUnderlay";

function roomUnderlay(): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview(parseAsciiDxf(readFileSync("tests/fixtures/dwg/room_4000x3000.dxf", "utf8")));
  return {
    sourceType: "dwg",
    fileName: "room_4000x3000.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: 4000,
    heightMm: 3000,
    opacity: 0.42,
    xMm: 0,
    zMm: 0,
    rotationDeg: 0,
    dwg: { preview, hiddenLayers: [] },
  };
}

describe("DWG trace assist", () => {
  it("maps the taped south wall onto the plan and snaps to its endpoints", () => {
    const underlay = roomUnderlay();
    const bounds = underlay.dwg!.preview.bounds;
    expect(cadToPlanPoint({ x: 0, y: 0 }, underlay, bounds)).toEqual({ x: -2000, z: 1500 });
    expect(cadToPlanPoint({ x: 4000, y: 0 }, underlay, bounds)).toEqual({ x: 2000, z: 1500 });
    const ends = collectDwgPlanEndpoints(underlay);
    expect(ends).toContainEqual({ x: -2000, z: 1500 });
    expect(snapPlanPointToDwg({ x: -1988, z: 1492 }, 50, ends)).toEqual({ x: -2000, z: 1500 });
  });

  it("suggests the L-shaped Walls layer as a closed room", () => {
    const polygon = suggestRoomPolygonFromDwg(roomUnderlay());
    expect(new Set((polygon ?? []).map((point) => `${point.x},${point.z}`))).toEqual(new Set([
      "-2000,1500", "2000,1500", "2000,-300", "200,-300", "200,-1500", "-2000,-1500",
    ]));
  });

  it("recognizes BASE-CABINET and places it on the suggested west wall", () => {
    const underlay = roomUnderlay();
    expect(recognizedCabinetInserts(underlay.dwg?.preview.inserts)).toEqual([
      { name: "BASE-CABINET", layer: "Cabinets", x: 200, y: 400, rotation: 0, catalogItemId: "living:base-cabinet-900" },
    ]);
    const blank = setLivingRoomPlanUnderlay(
      applyPlannerStarterTemplate(createLivingRoomStarterProject({ now: "2026-09-21T00:00:00.000Z" }), "blank-room"),
      underlay,
    );
    const traced = drawRoomFromPoints(blank, { kind: "polygon", points: suggestRoomPolygonFromDwg(underlay)! }, { raised: true });
    const placed = placeRecognizedDwgCabinets(traced, underlay);
    const cabinet = placed.objects.find((object) => object.catalogItemId === "living:base-cabinet-900");
    expect(cabinet).toBeTruthy();
    expect(cabinet?.extensions?.wallAttachment).toMatchObject({ wallId: expect.any(String) });
  });

  it("keeps two recognized inserts at distinct wall offsets", () => {
    const underlay = roomUnderlay();
    underlay.dwg = {
      ...underlay.dwg!,
      preview: {
        ...underlay.dwg!.preview,
        inserts: [
          { name: "BASE-CABINET", layer: "Cabinets", x: 200, y: 400, rotation: 0 },
          { name: "BASE-CABINET", layer: "Cabinets", x: 200, y: 1600, rotation: 0 },
        ],
      },
    };
    const traced = drawRoomFromPoints(
      setLivingRoomPlanUnderlay(
        applyPlannerStarterTemplate(createLivingRoomStarterProject({ now: "2026-09-21T00:00:00.000Z" }), "blank-room"),
        underlay,
      ),
      { kind: "polygon", points: suggestRoomPolygonFromDwg(underlay)! },
      { raised: true },
    );
    const cabinets = placeRecognizedDwgCabinets(traced, underlay).objects.filter(
      (object) => object.catalogItemId === "living:base-cabinet-900",
    );
    expect(cabinets).toHaveLength(2);
    expect(`${cabinets[0]!.position.x}:${cabinets[0]!.position.z}`).not.toBe(
      `${cabinets[1]!.position.x}:${cabinets[1]!.position.z}`,
    );
  });

  it("does not snap to a hidden underlay", () => {
    expect(collectDwgPlanEndpoints({ ...roomUnderlay(), hidden: true })).toEqual([]);
  });

  it("does not suggest walls from a hidden Walls layer even when named", () => {
    const hidden = roomUnderlay();
    hidden.dwg = { ...hidden.dwg!, hiddenLayers: ["Walls"] };
    expect(suggestRoomPolygonFromDwg(hidden, ["Walls"])).toBeNull();
  });

  it("does not close a room from a south-wall-only region", () => {
    expect(suggestRoomPolygonFromDwg(roomUnderlay(), ["Walls"], {
      minX: -1900, maxX: 1900, minZ: 1400, maxZ: 1600,
    })).toBeNull();
  });
});
