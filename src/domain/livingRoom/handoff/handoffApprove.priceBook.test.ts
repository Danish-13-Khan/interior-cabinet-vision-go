import { describe, expect, it } from "vitest";
import { createDefaultPriceBook } from "../../priceBook";
import {
  cabinetProjectFromInteriorProject,
  interiorProjectFromCabinetProject,
} from "../../interiorProject";
import { freezeProposal, recordProposalRelease } from "../proposal";
import { createGoldenCabinetRunProject, GOLDEN_CABINET_RUN_NOW } from "../goldenRun";
import { canApproveEngineeringRevision } from "./handoffApprove";

describe("canApproveEngineeringRevision with a price book", () => {
  const now = GOLDEN_CABINET_RUN_NOW;
  const book = createDefaultPriceBook();

  it("stays approvable after a Present-style freeze that used the book", () => {
    const frozen = freezeProposal(createGoldenCabinetRunProject(), now, undefined, {
      priceBook: book,
    });
    const released = recordProposalRelease(frozen, now);
    expect(canApproveEngineeringRevision(released)).toBe(false);
    expect(canApproveEngineeringRevision(released, { priceBook: book })).toBe(true);
  });

  it("survives interiors file save/reopen with the same book", () => {
    const released = recordProposalRelease(
      freezeProposal(createGoldenCabinetRunProject(), now, undefined, { priceBook: book }),
      now,
    );
    const adapted = cabinetProjectFromInteriorProject(released);
    const saved = adapted.project.interiorDocument
      ? adapted.project.interiorDocument
      : interiorProjectFromCabinetProject({
          project: adapted.project,
          activeRoom: adapted.room,
          now,
        });
    expect(canApproveEngineeringRevision(saved, { priceBook: book })).toBe(true);
  });
});
