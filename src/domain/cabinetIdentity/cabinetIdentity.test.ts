import { describe, expect, it } from "vitest";
import { createLivingRoomObject } from "../livingRoom/catalog";
import { createEmptyInteriorProject } from "../interiorProject/defaults";
import {
  catalogBindingFor,
  diagnoseInteriorCabinets,
  parseCabinetType,
  persistCabinetIdentityOnObject,
  readCabinetIdentity,
} from "./index";

describe("cabinet identity", () => {
  it("does not treat display category as a technical type", () => {
    expect(parseCabinetType("storage")).toBeNull();
    expect(parseCabinetType("wardrobe")).toBeNull();
    expect(parseCabinetType("base")).toBe("base");
    expect(parseCabinetType("wall")).toBe("wall");
  });

  it("maps catalog ids to type and family without using category", () => {
    expect(catalogBindingFor("living:wall-cabinet-900")).toMatchObject({
      cabinetType: "wall",
      familyId: "frameless-standard-wall",
      sku: "MW-WALL-900",
    });
    expect(catalogBindingFor("living:base-cabinet-900")?.cabinetType).toBe("base");
    expect(catalogBindingFor("living:tall-pantry-600")?.cabinetType).toBe("tall");
    expect(catalogBindingFor("living:drawer-cabinet-900")?.cabinetType).toBe("drawer");
    expect(catalogBindingFor("living:feature-wall-fluted")).toBeNull();
  });

  it("persists explicit identity on a placed catalog cabinet", () => {
    const placed = createLivingRoomObject("living:wall-cabinet-900", {
      id: "wall-1",
      roomId: "room-1",
      position: { x: 0, y: 1400, z: 0 },
    });
    const identity = readCabinetIdentity(placed);
    expect(placed.category).toBe("storage");
    expect(identity?.cabinetType).toBe("wall");
    expect(identity?.familyId).toBe("frameless-standard-wall");
    expect(identity?.sku).toBe("MW-WALL-900");
  });

  it("does not invent a base cabinet from a generic storage object", () => {
    const orphan = persistCabinetIdentityOnObject({
      id: "orphan",
      roomId: "room-1",
      kind: "cabinet",
      category: "storage",
      catalogItemId: "unknown:storage-box",
      name: "Storage Box",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 800, heightMm: 720, depthMm: 560 },
      materialSlots: {},
      parameters: { wallCabinet: true },
    });
    expect(readCabinetIdentity(orphan)).toBeNull();
    const document = createEmptyInteriorProject({ id: "loss", name: "Loss" });
    document.objects = [orphan];
    const report = diagnoseInteriorCabinets(document);
    expect(report.blocking).toBe(true);
    expect(report.diagnostics.some((item) => item.code === "silent-fallback-blocked")).toBe(true);
  });

  it("keeps an explicit unknown family and blocks production", () => {
    const document = createEmptyInteriorProject({ id: "unknown-family", name: "Unknown" });
    document.objects = [{
      id: "cab-1",
      roomId: document.activeRoomId || "room-1",
      kind: "cabinet",
      category: "storage",
      catalogItemId: "living:base-cabinet-900",
      name: "Base",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { widthMm: 900, heightMm: 720, depthMm: 560 },
      materialSlots: {},
      parameters: {},
      extensions: {
        cabinetIdentity: {
          objectId: "cab-1",
          catalogItemId: "living:base-cabinet-900",
          sku: null,
          cabinetType: "base",
          familyId: "not-a-real-family",
          category: "storage",
          name: "Base",
          roomId: "room-1",
        },
      },
    }];
    const identity = readCabinetIdentity(document.objects[0]!);
    const report = diagnoseInteriorCabinets(document);
    expect(identity?.familyId).toBe("not-a-real-family");
    expect(report.blocking).toBe(true);
    expect(report.diagnostics.some((item) => item.code === "unknown-family")).toBe(true);
  });
});
