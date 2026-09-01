import { describe, expect, it } from "vitest";
import { createOffsetDuplicate } from "../cabinetDuplication";
import { defaultCabinetProject, getDefaultCabinetConfig } from "../cabinetDimensions";
import { interiorProjectFromCabinetProject } from "../interiorProject";
import { DEFAULT_ROOM } from "../roomModel";
import { createProjectReport } from "../projectReport";
import {
  createExportableCabinetCutlist,
  createExportableProjectCutlist,
  resolveExportableProjectCutlist,
} from "../productionOutputs";
import { createCabinetProductionCutlist } from "../productionCutlist";
import { createDefaultProjectRoom } from "../projectRooms";
import { diagnoseCabinetProject, diagnoseProjectIdentity, withNewCabinetIdentity } from "./index";
import { createGoldenCabinetInstance } from "./goldenFixtures";

describe("cabinet identity copy and production gate", () => {
  it("clears interiorObjectId when copying or minting a new identity", () => {
    const source = {
      ...createGoldenCabinetInstance("frameless-standard-base"),
      interiorObjectId: "room-1:object:golden-base",
    };
    const minted = withNewCabinetIdentity(source, "copy-1");
    expect(minted.id).toBe("copy-1");
    expect(minted.interiorObjectId).toBeUndefined();
    const duplicate = createOffsetDuplicate(
      source,
      0,
      { version: 1, cabinets: [source] },
      DEFAULT_ROOM,
      { widthMm: 6000, depthMm: 4000, heightMm: 2800 },
    );
    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.interiorObjectId).toBeUndefined();
  });

  it("diagnoses current cabinet edits even when interiorDocument is stale", () => {
    const clean = createGoldenCabinetInstance("frameless-standard-base");
    const document = interiorProjectFromCabinetProject({
      project: { version: 1, cabinets: [clean] },
      activeRoom: DEFAULT_ROOM,
    });
    const dirty = {
      ...clean,
      config: { ...getDefaultCabinetConfig("base"), familyId: "not-a-real-family" },
    };
    const report = diagnoseProjectIdentity({
      version: 1,
      cabinets: [dirty],
      interiorDocument: document,
    });
    expect(report.blocking).toBe(true);
    expect(report.diagnostics.some((item) => item.code === "unknown-family")).toBe(true);
  });

  it("empties every exportable cutlist when production is blocked", () => {
    const cabinet = {
      ...createGoldenCabinetInstance("frameless-standard-base"),
      config: {
        ...getDefaultCabinetConfig("base"),
        familyId: "not-a-real-family",
      },
    };
    const project = { ...defaultCabinetProject, cabinets: [cabinet] };
    expect(createCabinetProductionCutlist(cabinet).length).toBeGreaterThan(0);
    expect(createExportableProjectCutlist(project)).toEqual([]);
    expect(createExportableCabinetCutlist(project, cabinet)).toEqual([]);
    const report = createProjectReport(project, DEFAULT_ROOM);
    expect(report.productionBlocked).toBe(true);
    expect(report.productionCutlist).toEqual([]);
    expect(report.perItemCutlists.every((item) => item.lines.length === 0)).toBe(true);
  });

  it("unblocks production after a family repair even if interiorDocument is stale", () => {
    const dirty = {
      ...createGoldenCabinetInstance("frameless-standard-base"),
      config: { ...getDefaultCabinetConfig("base"), familyId: "not-a-real-family" },
    };
    const staleDocument = interiorProjectFromCabinetProject({
      project: { version: 1, cabinets: [dirty] },
      activeRoom: DEFAULT_ROOM,
    });
    expect(diagnoseProjectIdentity({
      version: 1,
      cabinets: [dirty],
      interiorDocument: staleDocument,
    }).blocking).toBe(true);
    const repaired = createGoldenCabinetInstance("frameless-standard-base");
    const afterRepair = diagnoseProjectIdentity({
      version: 1,
      cabinets: [repaired],
      interiorDocument: staleDocument,
    });
    expect(afterRepair.blocking).toBe(false);
    expect(afterRepair.diagnostics.some((item) => item.code === "unknown-family")).toBe(false);
  });

  it("blocks production when an inactive room has an invalid family", () => {
    const kitchen = createGoldenCabinetInstance("frameless-standard-base");
    const utility = {
      ...createGoldenCabinetInstance("frameless-standard-wall"),
      id: "utility-invalid",
      config: { ...getDefaultCabinetConfig("wall"), familyId: "not-a-real-family" },
    };
    const project = {
      version: 1,
      cabinets: [kitchen],
      activeRoomId: "kitchen",
      rooms: [
        createDefaultProjectRoom([kitchen], DEFAULT_ROOM, "Kitchen", "kitchen"),
        createDefaultProjectRoom([utility], DEFAULT_ROOM, "Utility", "utility"),
      ],
    };
    const report = diagnoseProjectIdentity(project);
    expect(report.blocking).toBe(true);
    expect(report.diagnostics.some((item) => (
      item.code === "unknown-family" && item.objectId === "utility-invalid"
    ))).toBe(true);
    expect(resolveExportableProjectCutlist(project).blocked).toBe(true);
    expect(createExportableProjectCutlist(project)).toEqual([]);
  });

  it("reports a missing family on a Cabinet project", () => {
    const seed = createGoldenCabinetInstance("frameless-standard-base");
    const { familyId: _familyId, ...config } = seed.config;
    const report = diagnoseCabinetProject({
      version: 1,
      cabinets: [{ ...seed, config }],
    });
    expect(report.diagnostics.some((item) => item.code === "family-resolved-from-type")).toBe(true);
    expect(report.blocking).toBe(false);
  });
});
