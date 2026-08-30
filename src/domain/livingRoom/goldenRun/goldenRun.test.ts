import { describe, expect, it } from "vitest";
import { diagnoseInteriorCabinets, GOLDEN_CABINET_FAMILY_IDS, readCabinetIdentity } from "../../cabinetIdentity";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFileName,
  interiorProjectFromCabinetProject,
  validateInteriorProject,
} from "../../interiorProject";
import { inspectLivingRoomPlan, isBlockingLivingRoomPlanIssue } from "../planConstraints";
import { freezeProposal } from "../proposal";
import { countertopTouchesCabinet } from "../cabinetSceneRunExtras";
import { compileLivingRoomScene } from "../sceneCompiler";
import { countCabinetRunFillers, cabinetRunForObject, isCabinetRunFiller } from "../wardrobePlacement";
import { adaptHandoffProject, canApproveEngineeringRevision, lossyGoldenObjectIds } from "../handoff";
import { listGoldenSceneCountertops } from "./sceneSemantics";
import { readProposalCommercial } from "../proposal/commercialState";
import { createLivingRoomReleaseDemoProject } from "../releaseDemo";
import { createGoldenCabinetRunProject } from "./createProject";
import { readGoldenRunFixtureVersion } from "./serialize";
import {
  GOLDEN_CABINET_RUN_FIXTURE_VERSION,
  GOLDEN_CABINET_RUN_ID,
  GOLDEN_CABINET_RUN_NAME,
  GOLDEN_CABINET_RUN_NOW,
  GOLDEN_RUN_FILLER_IDS,
  GOLDEN_RUN_JOB,
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_ROOM_ID,
  GOLDEN_RUN_WALL_BACK_ID,
} from "./types";

describe("golden cabinet run fixture", () => {
  it("is deterministic, versioned, and topologically valid", () => {
    const first = createGoldenCabinetRunProject();
    const second = createGoldenCabinetRunProject();
    expect(first).toEqual(second);
    expect(first.id).toBe(GOLDEN_CABINET_RUN_ID);
    expect(first.name).toBe(GOLDEN_CABINET_RUN_NAME);
    expect(readGoldenRunFixtureVersion(first)).toBe(GOLDEN_CABINET_RUN_FIXTURE_VERSION);
    expect(validateInteriorProject(first).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(first.activeRoomId).toBe(GOLDEN_RUN_ROOM_ID);
    expect(first.openings.some((item) => item.kind === "door")).toBe(true);
    expect(first.openings.some((item) => item.kind === "window")).toBe(true);
    expect(first.units).toBe("mm");
  });

  it("places every golden family on a filler-forced run without adapter loss", () => {
    const project = createGoldenCabinetRunProject();
    const families = project.objects
      .map((item) => readCabinetIdentity(item)?.familyId)
      .filter(Boolean);
    expect(new Set(families)).toEqual(new Set(GOLDEN_CABINET_FAMILY_IDS));
    expect(project.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseB)?.parameters.doorStyle)
      .toBe("shaker");
    const host = project.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseA)!;
    const run = cabinetRunForObject(host);
    expect(run?.wallId).toBe(GOLDEN_RUN_WALL_BACK_ID);
    expect(run?.fillersEnabled).toBe(true);
    expect(countCabinetRunFillers(project, run!.runId)).toBe(2);
    expect(project.objects.filter(isCabinetRunFiller)).toHaveLength(2);
    expect(diagnoseInteriorCabinets(project).blocking).toBe(false);
    expect(lossyGoldenObjectIds(project)).toEqual([]);
    expect(inspectLivingRoomPlan(project).filter(isBlockingLivingRoomPlanIssue)).toEqual([]);
    const tops = listGoldenSceneCountertops(project);
    expect(tops.length).toBeGreaterThan(0);
    expect(tops.some((top) => top.cabinetIds.includes(GOLDEN_RUN_OBJECT_IDS.baseA))).toBe(true);
    expect(countertopTouchesCabinet(compileLivingRoomScene(project).nodes, GOLDEN_RUN_OBJECT_IDS.baseA)).toBe(true);
    expect(countertopTouchesCabinet(compileLivingRoomScene(project).nodes, GOLDEN_RUN_OBJECT_IDS.tall)).toBe(false);
  });

  it("maps golden fillers into Engineering with the same ids and filler role", () => {
    const project = createGoldenCabinetRunProject();
    const fillerIds = Object.values(GOLDEN_RUN_FILLER_IDS);
    for (const id of fillerIds) {
      const object = project.objects.find((item) => item.id === id);
      expect(object).toBeTruthy();
      expect(isCabinetRunFiller(object!)).toBe(true);
      expect(readCabinetIdentity(object!)?.catalogItemId).toBe("living:run-filler");
      expect(object!.extensions?.cabinetPlanning).toMatchObject({
        sourceId: id,
        entityId: id,
        runFiller: { side: expect.stringMatching(/start|end/) },
        displayCategory: "filler",
      });
    }
    const adapted = adaptHandoffProject(project);
    const cabinets = adapted.project.cabinets;
    for (const id of fillerIds) {
      const cabinet = cabinets.find((item) => item.id === id || item.interiorObjectId === id);
      expect(cabinet, `Engineering dropped filler ${id}`).toBeTruthy();
      expect(cabinet!.displayCategory).toBe("filler");
      expect(cabinet!.runFiller?.side).toMatch(/start|end/);
      expect(cabinet!.config.catalogItemId).toBe("living:run-filler");
      expect(cabinet!.config.dimensions.width).toBe(100);
    }
    expect(lossyGoldenObjectIds(project)).toEqual([]);
    const resaved = interiorProjectFromCabinetProject({
      project: adapted.project,
      activeRoom: adapted.room,
      now: GOLDEN_CABINET_RUN_NOW,
    });
    expect(resaved.objects.filter(isCabinetRunFiller).map((item) => item.id).sort()).toEqual([...fillerIds].sort());
  });

  it("preserves interiors names on save and keeps GCR-001 golden filename", () => {
    const golden = createGoldenCabinetRunProject();
    const adaptedGolden = cabinetProjectFromInteriorProject(golden);
    const savedGolden = interiorProjectFromCabinetProject({
      project: adaptedGolden.project,
      activeRoom: adaptedGolden.room,
      now: GOLDEN_CABINET_RUN_NOW,
    });
    expect(savedGolden.name).toBe(GOLDEN_CABINET_RUN_NAME);
    expect(savedGolden.rooms.some((room) => room.roomType === "living-room")).toBe(true);
    expect(interiorProjectFileName(savedGolden.name, readProposalCommercial(savedGolden).job))
      .toBe("gcr-001-golden-cabinet-run.json");
    expect(interiorProjectFileName(GOLDEN_CABINET_RUN_NAME, GOLDEN_RUN_JOB))
      .toBe("gcr-001-golden-cabinet-run.json");

    const demo = createLivingRoomReleaseDemoProject();
    const adaptedDemo = cabinetProjectFromInteriorProject(demo);
    const savedDemo = interiorProjectFromCabinetProject({
      project: adaptedDemo.project,
      activeRoom: adaptedDemo.room,
      now: demo.updatedAt,
    });
    expect(savedDemo.name).toBe("Living Room Release Demo");
    expect(interiorProjectFileName(savedDemo.name, readProposalCommercial(savedDemo).job))
      .toBe("living-room-release-demo.json");
    expect(interiorProjectFileName("Living Room Release Demo", { projectNumber: "JOB-001", customerName: "" }))
      .toBe("living-room-release-demo.json");
  });

  it("keeps a frozen quote matching after interiors file save", () => {
    const frozen = freezeProposal(createGoldenCabinetRunProject(), GOLDEN_CABINET_RUN_NOW);
    const adapted = cabinetProjectFromInteriorProject(frozen);
    const saved = adapted.project.interiorDocument
      ? adapted.project.interiorDocument
      : interiorProjectFromCabinetProject({
          project: adapted.project,
          activeRoom: adapted.room,
          now: GOLDEN_CABINET_RUN_NOW,
        });
    expect(canApproveEngineeringRevision(saved)).toBe(true);
    expect(saved.rooms.some((room) => room.roomType === "living-room")).toBe(true);
  });
});
