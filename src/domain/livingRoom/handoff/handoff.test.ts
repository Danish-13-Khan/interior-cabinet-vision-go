import { describe, expect, it } from "vitest";
import {
  CABINET_IDENTITY_EXTENSION,
  CABINET_PLANNING_EXTENSION,
  GOLDEN_CABINET_FAMILY_IDS,
  familyType,
} from "../../cabinetIdentity";
import { createProjectReport } from "../../projectReport";
import { createGoldenCabinetSceneProject } from "../goldenCabinetScene";
import { createGoldenProposalProject } from "../proposal/goldenProposal";
import { readProposalCommercial } from "../proposal/commercialState";
import {
  adaptHandoffProject,
  buildHandoffGate,
  buildHandoffSummary,
  commitEngineeringHandoff,
  diagnoseHandoffLoss,
  mapDocumentHandoffSelection,
  readHandoffRecord,
} from ".";
import { createApprovedGoldenSceneProject, createApprovedHandoffProject } from "./handoff.testHelpers";

const NOW = "2026-08-30T12:00:00.000Z";

function stripGoldenIdentity(document: ReturnType<typeof createGoldenCabinetSceneProject>) {
  const target = document.objects.find((object) => object.kind === "cabinet");
  if (!target) throw new Error("Expected a golden cabinet.");
  return {
    ...document,
    objects: document.objects.map((object) => {
      if (object.id !== target.id) return object;
      const { [CABINET_IDENTITY_EXTENSION]: _id, [CABINET_PLANNING_EXTENSION]: _plan, ...extensions } =
        object.extensions ?? {};
      return {
        ...object,
        catalogItemId: "unknown-cabinet",
        category: "storage",
        extensions,
      };
    }),
  };
}

describe("engineering handoff contract", () => {
  it("opens the same golden cabinet IDs without recreating them", () => {
    const document = createApprovedGoldenSceneProject(NOW);
    const summary = buildHandoffSummary(document);
    const adapted = adaptHandoffProject(document);
    const ids = adapted.project.cabinets.map((cabinet) => cabinet.id).sort();
    expect(ids).toEqual(GOLDEN_CABINET_FAMILY_IDS.map((familyId) => `golden-${familyType(familyId)}`).sort());
    expect(summary.cabinets.every((line) => line.cabinetId === line.objectId || line.cabinetId.startsWith("golden-"))).toBe(true);
    expect(summary.lossyGoldenIds).toEqual([]);
    expect(buildHandoffGate(document).ready).toBe(true);
    for (const cabinet of adapted.project.cabinets) {
      expect(cabinet.config.familyId).toBeTruthy();
      expect(cabinet.config.composition).toBeTruthy();
      expect(cabinet.config.construction).toBeTruthy();
      expect(cabinet.config.hardware).toBeTruthy();
    }
  });

  it("preserves revision identity and selected cabinet IDs", () => {
    const document = createApprovedHandoffProject(NOW);
    const before = readProposalCommercial(document).job.revision;
    const selected = [document.objects.find((object) => object.kind === "cabinet")!.id];
    const handed = commitEngineeringHandoff(document, selected, NOW);
    const record = readHandoffRecord(handed);
    expect(readProposalCommercial(handed).job.revision).toBe(before);
    expect(record?.revision).toBe(before);
    expect(record?.cabinetIds).toEqual(adaptHandoffProject(handed).project.cabinets.map((item) => item.id));
    expect(mapDocumentHandoffSelection(handed, selected)).toEqual(selected);
  });

  it("builds a production report without fallback warnings", () => {
    const adapted = adaptHandoffProject(createGoldenCabinetSceneProject(NOW));
    const report = createProjectReport(adapted.project, adapted.room);
    expect(report.productionBlocked).toBe(false);
    expect(report.identityDiagnostics.filter((item) =>
      item.code === "family-resolved-from-type" ||
      item.code === "silent-fallback-blocked" ||
      item.code === "skipped-unidentified-cabinet",
    )).toEqual([]);
    expect(adapted.diagnostics).toEqual([]);
  });

  it("blocks lossy golden cabinet mapping", () => {
    const document = createGoldenCabinetSceneProject(NOW);
    const target = document.objects.find((object) => object.kind === "cabinet")!;
    const twisted = {
      ...document,
      objects: document.objects.map((object) =>
        object.id === target.id
          ? { ...object, rotation: { ...object.rotation, y: 45 } }
          : object,
      ),
    };
    const gate = buildHandoffGate(twisted);
    expect(gate.ready).toBe(false);
    expect(gate.lossyGoldenCount).toBeGreaterThan(0);
    expect(gate.items.some((item) => item.id === "lossy-golden")).toBe(true);

    const stripped = stripGoldenIdentity(document);
    const strippedGate = buildHandoffGate(stripped);
    expect(strippedGate.ready).toBe(false);
    expect(strippedGate.items.some((item) => item.id === "adapter" || item.id === "lossy-golden")).toBe(true);
  });

  it("does not treat a draft or quoted design as ready to send", () => {
    const draft = createGoldenProposalProject(NOW);
    expect(buildHandoffGate(draft).items.some((item) => item.id === "approval")).toBe(true);
    expect(buildHandoffGate(draft).ready).toBe(false);
    expect(commitEngineeringHandoff(draft, [], NOW).extensions?.engineeringHandoff).toBeUndefined();
  });

  it("reports field-level golden loss when clamp changes authored dimensions", () => {
    const document = createGoldenCabinetSceneProject(NOW);
    const target = document.objects.find((object) => object.kind === "cabinet")!;
    const crushed = {
      ...document,
      objects: document.objects.map((object) =>
        object.id === target.id
          ? { ...object, dimensions: { ...object.dimensions, widthMm: 50 } }
          : object,
      ),
    };
    const notes = diagnoseHandoffLoss(crushed).filter((note) => note.code === "lossy-field");
    expect(notes.some((note) => note.path.includes("dimensions.width"))).toBe(true);
    expect(buildHandoffGate(crushed).items.some((item) => item.id === "lossy-golden")).toBe(true);
  });
});
