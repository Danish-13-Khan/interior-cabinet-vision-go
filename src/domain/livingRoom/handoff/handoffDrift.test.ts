import { describe, expect, it } from "vitest";
import {
  adaptHandoffProject,
  commitEngineeringHandoff,
  evaluatePostApprovalDrift,
  readHandoffRecord,
} from ".";
import { createApprovedGoldenSceneProject } from "./handoff.testHelpers";

const NOW = "2026-08-30T12:00:00.000Z";

describe("post-approval handoff drift", () => {
  it("shows no drift immediately after handoff", () => {
    const handed = commitEngineeringHandoff(createApprovedGoldenSceneProject(NOW), [], NOW);
    const adapted = adaptHandoffProject(handed);
    const drift = evaluatePostApprovalDrift(adapted.project);
    expect(drift.handedOff).toBe(true);
    expect(drift.drifted).toBe(false);
    expect(drift.revision).toBe(readHandoffRecord(handed)?.revision);
    expect(drift.summary).toMatch(/Matches approved Rev/);
  });

  it("reports drift after an engineering width change and keeps the approved snapshot", () => {
    const handed = commitEngineeringHandoff(createApprovedGoldenSceneProject(NOW), [], NOW);
    const adapted = adaptHandoffProject(handed);
    const first = adapted.project.cabinets[0]!;
    const changed = {
      ...adapted.project,
      cabinets: adapted.project.cabinets.map((cabinet) =>
        cabinet.id === first.id
          ? {
              ...cabinet,
              config: {
                ...cabinet.config,
                dimensions: { ...cabinet.config.dimensions, width: cabinet.config.dimensions.width + 120 },
              },
            }
          : cabinet,
      ),
      interiorDocument: handed,
    };
    const drift = evaluatePostApprovalDrift(changed);
    expect(drift.drifted).toBe(true);
    expect(drift.summary).toMatch(/Post-approval drift/);
    expect(readHandoffRecord(changed.interiorDocument)?.fingerprint).toEqual(
      readHandoffRecord(handed)?.fingerprint,
    );
  });

  it("reports drift when an approved cabinet is moved or rotated", () => {
    const handed = commitEngineeringHandoff(createApprovedGoldenSceneProject(NOW), [], NOW);
    const adapted = adaptHandoffProject(handed);
    const first = adapted.project.cabinets[0]!;
    const moved = {
      ...adapted.project,
      cabinets: adapted.project.cabinets.map((cabinet) =>
        cabinet.id === first.id
          ? {
              ...cabinet,
              placement: {
                ...cabinet.placement,
                x: cabinet.placement.x + 240,
                rotation: ((cabinet.placement.rotation + 90) % 360) as typeof cabinet.placement.rotation,
              },
            }
          : cabinet,
      ),
      interiorDocument: handed,
    };
    const drift = evaluatePostApprovalDrift(moved);
    expect(drift.drifted).toBe(true);
    expect(drift.summary).toMatch(/placement or configuration/);
    expect(readHandoffRecord(moved.interiorDocument)?.designFingerprint).toBe(
      readHandoffRecord(handed)?.designFingerprint,
    );
  });

  it("does not invent handoff state before Send to Engineering", () => {
    const adapted = adaptHandoffProject(createApprovedGoldenSceneProject(NOW));
    const drift = evaluatePostApprovalDrift(adapted.project);
    expect(drift.handedOff).toBe(false);
    expect(drift.drifted).toBe(false);
  });
});
