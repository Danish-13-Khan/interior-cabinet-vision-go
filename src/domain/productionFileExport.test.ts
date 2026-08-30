import { describe, expect, it } from "vitest";
import { defaultCabinetProject, getDefaultCabinetConfig } from "./cabinetDimensions";
import { createGoldenCabinetInstance } from "./cabinetIdentity";
import { exportProjectMachineFile } from "./machineExport";
import {
  ProductionIdentityBlockedError,
  resolveExportableProjectCutlist,
} from "./productionOutputs";
import {
  commitPreparedExport,
  prepareCutlistCsvExport,
  prepareMachineFileExport,
} from "./productionFileExport";

function blockedProject() {
  const cabinet = {
    ...createGoldenCabinetInstance("frameless-standard-base"),
    config: {
      ...getDefaultCabinetConfig("base"),
      familyId: "not-a-real-family",
    },
  };
  return { ...defaultCabinetProject, cabinets: [cabinet] };
}

describe("production file export gate", () => {
  it("does not write a file when identity blocks export", () => {
    const project = blockedProject();
    const writes: string[] = [];
    const prepared = prepareCutlistCsvExport(project);
    const result = commitPreparedExport(
      prepared,
      (contents) => writes.push(contents),
      "Production cutlist exported to CSV.",
    );
    expect(resolveExportableProjectCutlist(project).blocked).toBe(true);
    expect(prepared.ok).toBe(false);
    expect(result.wrote).toBe(false);
    expect(writes).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
    expect(result.status).toContain("not-a-real-family");
  });

  it("does not write a machine file and reports the diagnostic status", () => {
    const project = blockedProject();
    const writes: string[] = [];
    const prepared = prepareMachineFileExport(project, "json-preview");
    const result = commitPreparedExport(
      prepared,
      (contents) => writes.push(contents),
      "Exported machining intent JSON.",
    );
    expect(prepared.ok).toBe(false);
    expect(result.wrote).toBe(false);
    expect(writes).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
    expect(() => exportProjectMachineFile(project, "json-preview")).toThrow(
      ProductionIdentityBlockedError,
    );
  });

  it("allows a genuinely empty valid project to export", () => {
    const project = { ...defaultCabinetProject, cabinets: [] };
    const writes: string[] = [];
    const prepared = prepareCutlistCsvExport(project);
    const result = commitPreparedExport(
      prepared,
      (contents) => writes.push(contents),
      "Production cutlist exported to CSV.",
    );
    expect(resolveExportableProjectCutlist(project).blocked).toBe(false);
    expect(prepared.ok).toBe(true);
    expect(result.wrote).toBe(true);
    expect(writes).toHaveLength(1);
    expect(result.status).toBe("Production cutlist exported to CSV.");
  });
});
