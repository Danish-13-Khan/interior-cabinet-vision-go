import { describe, expect, it } from "vitest";
import { createProjectReport } from "../projectReport";
import { cabinetProjectFromInteriorProject, validateInteriorProject } from "../interiorProject";
import { listCurrentProjectCabinets } from "../cabinetIdentity";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { instantiateApartmentTemplate } from "./index";

const options = { now: COMPOSER_TEST_NOW };
const PHASE5 = [
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
] as const;

describe("Phase 5 2 BHK and 3 BHK templates", () => {
  it("instantiates without validation repairs", () => {
    for (const id of PHASE5) {
      const project = instantiateApartmentTemplate(id, options);
      const result = validateInteriorProject(project);
      expect(result.issues.filter((issue) => issue.repaired), id).toEqual([]);
      expect(result.issues.filter((issue) => issue.severity === "error"), id).toEqual([]);
      expect(project.extensions?.apartmentTemplateId).toBe(id);
    }
  });

  it("production export succeeds across all rooms", () => {
    for (const id of PHASE5) {
      const project = instantiateApartmentTemplate(id, options);
      const adapted = cabinetProjectFromInteriorProject(project);
      const cabinets = listCurrentProjectCabinets(adapted.project);
      expect(cabinets.length, id).toBeGreaterThan(0);
      const exportProject = { ...adapted.project, cabinets };
      const exportRoom = adapted.project.rooms?.find((room) => room.cabinets.length)?.config
        ?? adapted.room;
      const report = createProjectReport(exportProject, exportRoom);
      expect(report.productionBlocked, id).toBe(false);
      expect(report.productionCutlist.length, id).toBeGreaterThan(0);
      expect(report.hardwareSchedule.length, id).toBeGreaterThan(0);
    }
  });
});
