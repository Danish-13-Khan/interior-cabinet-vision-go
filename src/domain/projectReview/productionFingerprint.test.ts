import { describe, expect, it } from "vitest";
import { defaultCabinetProject } from "../cabinetDimensions";
import { createGoldenCabinetInstance } from "../cabinetIdentity";
import { DEFAULT_DRAFTING } from "../draftingAnnotations";
import { DEFAULT_ROOM } from "../roomModel";
import { createDefaultProjectSheetSet } from "../sheetDocuments";
import { DEFAULT_SHEET_OPTIMIZER } from "../sheetStock";
import { createProductionPacketFingerprint } from "./productionFingerprint";

function goldenProject() {
  return {
    ...defaultCabinetProject,
    cabinets: [createGoldenCabinetInstance("frameless-standard-base")],
  };
}

describe("production packet fingerprint", () => {
  it("hashes packet-changing data, not only ids and totals", () => {
    const base = goldenProject();
    const hash = createProductionPacketFingerprint(base);
    expect(hash).toMatch(/^prd-pkt-v2-/);
    expect(createProductionPacketFingerprint(base)).toBe(hash);

    const moved = {
      ...base,
      cabinets: base.cabinets.map((cabinet) => ({
        ...cabinet,
        placement: { ...cabinet.placement, x: cabinet.placement.x + 50 },
      })),
    };
    expect(createProductionPacketFingerprint(moved)).not.toBe(hash);

    const resized = {
      ...base,
      cabinets: base.cabinets.map((cabinet) => ({
        ...cabinet,
        config: {
          ...cabinet.config,
          dimensions: {
            ...cabinet.config.dimensions,
            width: cabinet.config.dimensions.width + 50,
          },
        },
      })),
    };
    expect(createProductionPacketFingerprint(resized)).not.toBe(hash);

    const nested = {
      ...base,
      preferences: {
        ...base.preferences,
        snapSizeMm: base.preferences?.snapSizeMm ?? 50,
        showGrid: base.preferences?.showGrid ?? true,
        autoSaveToBrowser: base.preferences?.autoSaveToBrowser ?? true,
        sheetOptimizer: {
          ...(base.preferences?.sheetOptimizer ?? DEFAULT_SHEET_OPTIMIZER),
          kerfMm: 8,
        },
      },
    };
    expect(createProductionPacketFingerprint(nested)).not.toBe(hash);
  });

  it("hashes room, drafting, sheet-set, and active-room packet inputs", () => {
    const cabinet = createGoldenCabinetInstance("frameless-standard-base");
    const secondCabinet = createGoldenCabinetInstance("frameless-standard-drawer", "room-b-drawer");
    const base = {
      ...defaultCabinetProject,
      cabinets: [cabinet],
      rooms: [
        { id: "room-a", name: "Kitchen", config: structuredClone(DEFAULT_ROOM), cabinets: [cabinet] },
        { id: "room-b", name: "Utility", config: structuredClone(DEFAULT_ROOM), cabinets: [secondCabinet] },
      ],
      activeRoomId: "room-a",
      drafting: structuredClone(DEFAULT_DRAFTING),
      sheetSet: createDefaultProjectSheetSet("A"),
    };
    const hash = createProductionPacketFingerprint(base);

    const roomChanged = {
      ...base,
      rooms: base.rooms.map((room) => room.id === "room-a"
        ? {
            ...room,
            config: {
              ...room.config,
              dimensions: { ...room.config.dimensions, widthMm: room.config.dimensions.widthMm + 100 },
            },
          }
        : room),
    };
    expect(createProductionPacketFingerprint(roomChanged)).not.toBe(hash);

    const draftingChanged = {
      ...base,
      drafting: {
        ...base.drafting,
        notes: [{ id: "note-1", view: "top" as const, text: "Verify site dimension", anchor: { x: 0, y: 0, z: 0 } }],
      },
    };
    expect(createProductionPacketFingerprint(draftingChanged)).not.toBe(hash);

    const sheetSetChanged = {
      ...base,
      sheetSet: {
        ...base.sheetSet,
        sheets: base.sheetSet.sheets.map((sheet, index) =>
          index === 0 ? { ...sheet, notes: [...sheet.notes, "Installer to verify opening"] } : sheet,
        ),
      },
    };
    expect(createProductionPacketFingerprint(sheetSetChanged)).not.toBe(hash);

    expect(createProductionPacketFingerprint({ ...base, activeRoomId: "room-b" })).not.toBe(hash);
  });
});
