import { describe, expect, it } from "vitest";
import { readCabinetIdentity } from "../cabinetIdentity";
import { buildBoqFromReport } from "../boq";
import { validateInteriorProject } from "../interiorProject";
import { createProjectReport } from "../projectReport";
import {
  adaptHandoffProject,
  approveEngineeringRevision,
  buildHandoffGate,
  buildHandoffSummary,
  commitEngineeringHandoff,
  readHandoffRecord,
} from "../livingRoom/handoff";
import { createObjectRenderBinding } from "../livingRoom/renderAssetBindings";
import { freezeProposal, recordProposalRelease } from "../livingRoom/proposal";
import { instantiateLivingRoomCatalogTemplate } from "./instantiateNamedCatalogTemplates";

const NOW = "2026-09-28T01:00:00.000Z";

describe("production TV media unit", () => {
  it("carries the living-room template from GLB presentation through Engineering", () => {
    const project = instantiateLivingRoomCatalogTemplate({
      projectId: "media-unit-production",
      projectName: "Media Unit Production",
      now: NOW,
    });
    const mediaObject = project.objects.find((object) => object.catalogItemId === "cabinet-television-1")!;
    const identity = readCabinetIdentity(mediaObject);

    expect(mediaObject.kind).toBe("cabinet");
    expect(identity).toMatchObject({
      cabinetType: "media-unit",
      familyId: "frameless-standard-media-unit",
      sku: "MW-MEDIA-1600",
    });
    expect(createObjectRenderBinding(mediaObject, project.materials)).toMatchObject({
      strategy: "glb",
    });

    const adapted = adaptHandoffProject(project);
    const mediaCabinet = adapted.project.cabinets.find((cabinet) => cabinet.interiorObjectId === mediaObject.id)!;
    expect(mediaCabinet.config).toMatchObject({
      type: "media-unit",
      familyId: "frameless-standard-media-unit",
      sku: "MW-MEDIA-1600",
      dimensions: { width: 1600, height: 450, depth: 400 },
      hasDoors: true,
      shelfCount: 1,
      drawerCount: 0,
    });
    expect(mediaCabinet.config.composition?.openingStructure).toBeTruthy();
    expect(mediaCabinet.config.composition?.dividers.count).toBeGreaterThanOrEqual(2);
    expect(mediaCabinet.config.construction).toBeTruthy();

    const report = createProjectReport(adapted.project, adapted.room);
    expect(report.productionBlocked).toBe(false);
    expect(report.productionCutlist.length).toBeGreaterThan(0);
    expect(buildBoqFromReport(report).lines.length).toBeGreaterThan(0);
    expect(report.cabinetSchedule[0]?.familyId).toBe("frameless-standard-media-unit");
    expect(report.quote.cabinetLines).toHaveLength(1);
    expect(report.quote.cabinetLines[0]?.cabinetId).toBe(mediaCabinet.id);
    expect(report.projectCost.grandTotal).toBeGreaterThan(0);

    const approved = approveEngineeringRevision(
      recordProposalRelease(freezeProposal(project, NOW), NOW),
      NOW,
    );
    expect(buildHandoffSummary(approved).cabinetCount).toBe(1);
    expect(buildHandoffGate(approved).ready).toBe(true);
    const handedOff = commitEngineeringHandoff(approved, [mediaObject.id], NOW);
    expect(readHandoffRecord(handedOff)?.cabinetIds).toEqual([mediaCabinet.id]);
  });

  it("promotes only the explicitly bound TV catalog item in existing projects", () => {
    const project = instantiateLivingRoomCatalogTemplate({ projectId: "media-unit-upgrade", now: NOW });
    const tv = project.objects.find((object) => object.catalogItemId === "cabinet-television-1")!;
    const legacyTv = {
      ...tv,
      kind: "furniture" as const,
      extensions: { placement: "floor" },
    };
    const genericStorage = {
      ...legacyTv,
      id: `${legacyTv.id}-bookcase`,
      catalogItemId: "bookcase-open-1",
      name: "Bookcase Open",
    };
    const validated = validateInteriorProject({
      ...project,
      objects: project.objects
        .filter((object) => object.id !== tv.id)
        .concat(legacyTv, genericStorage),
    });
    const promoted = validated.project.objects.find((object) => object.id === legacyTv.id)!;
    const untouched = validated.project.objects.find((object) => object.id === genericStorage.id)!;

    expect(promoted.kind).toBe("cabinet");
    expect(readCabinetIdentity(promoted)?.cabinetType).toBe("media-unit");
    expect(untouched.kind).toBe("furniture");
    expect(readCabinetIdentity(untouched)).toBeNull();
    expect(validated.issues.some((issue) => issue.code === "cabinet-production-promoted")).toBe(true);
  });
});
