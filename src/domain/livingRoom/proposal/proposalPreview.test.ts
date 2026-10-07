import { describe, expect, it } from "vitest";
import { buildProposalDocument, createFrozenGoldenProposalProject } from ".";
import { proposalPreviewPageLabels } from "./proposalPreview";

describe("proposal preview page labels", () => {
  it("names the pages in the order the PDF writes them", () => {
    const proposal = buildProposalDocument(createFrozenGoldenProposalProject(), { now: "2026-08-30T10:00:00.000Z" });
    const labels = proposalPreviewPageLabels(proposal);
    expect(labels[0]).toBe("Cover");
    expect(labels.slice(1, -2)).toEqual(proposal.rooms.map((room) => room.roomName));
    expect(labels.slice(-2)).toEqual(["Finishes", "Price and approval"]);
    expect(labels).toHaveLength(proposal.rooms.length + 3);
  });
});
