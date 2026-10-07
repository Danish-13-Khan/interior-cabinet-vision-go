import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "../../apartmentTemplates/composers/bareRoom";
import { composeApartment } from "../../apartmentTemplates/composeApartment";
import { THREE_BHK_SHELL_SPEC } from "../../apartmentTemplates/specs/threeBhkShell";
import type { InteriorProject } from "../../interiorProject";
import { setProposalSelectedViews } from "./commercialState";
import { listProposalNamedViews, proposalViewToggleLock, toggleProposalView } from "./proposalViews";
import {
  PROPOSAL_VIEW_SELECTION_LIMIT,
  proposalViewSelection,
  withProposalViewSelection,
} from "./proposalViewSelection";
import { createQuoteDesignFingerprint } from "./quoteFingerprint";

const project = composeApartment(THREE_BHK_SHELL_SPEC, { now: COMPOSER_TEST_NOW });
const cameraId = (name: string) => project.cameras.find((camera) => camera.name === name)!.id;

function moveCamera(document: InteriorProject, id: string): InteriorProject {
  return {
    ...document,
    cameras: document.cameras.map((camera) =>
      camera.id === id ? { ...camera, position: { ...camera.position, x: camera.position.x + 250 } } : camera),
  };
}

describe("proposalViewSelection (roadmap D1)", () => {
  it("treats an empty stored selection as every bookmark, in bookmark order", () => {
    const implicit = withProposalViewSelection(project, []);
    const selection = proposalViewSelection(implicit);
    expect(selection.explicit).toBe(false);
    expect(selection.selectedIds).toEqual(selection.availableIds);
    expect(selection.availableIds).toHaveLength(THREE_BHK_SHELL_SPEC.rooms.length);
    expect(listProposalNamedViews(implicit).every((view) => view.selected)).toBe(true);
  });

  it("keeps the template's explicit selection and reports the rest as unselected", () => {
    const selection = proposalViewSelection(project);
    expect(selection.explicit).toBe(true);
    expect(selection.selectedIds).toHaveLength(7);
    const named = listProposalNamedViews(project);
    expect(named.filter((view) => view.selected).map((view) => view.cameraId)).toEqual(selection.selectedIds);
    expect(named.find((view) => view.viewName === "Balcony Showcase")?.selected).toBe(false);
  });

  it("unticking one view drops only that view, and ticking appends", () => {
    const kitchen = cameraId("Kitchen Showcase");
    const withoutKitchen = toggleProposalView(project, kitchen);
    expect(withoutKitchen).toHaveLength(6);
    expect(withoutKitchen).not.toContain(kitchen);
    const bath = cameraId("Guest Bath Showcase");
    const next = setProposalSelectedViews(project, withoutKitchen);
    const withBath = toggleProposalView(next, bath);
    expect(withBath).toEqual([...withoutKitchen, bath]);
    // Starting from an implicit "all" selection, the first untick must not re-select anything.
    const implicit = withProposalViewSelection(project, []);
    const first = toggleProposalView(implicit, bath);
    expect(first).toHaveLength(THREE_BHK_SHELL_SPEC.rooms.length - 1);
    expect(first).not.toContain(bath);
  });

  it("never unticks the last view, which would fall back to every bookmark", () => {
    const kitchen = cameraId("Kitchen Showcase");
    const only = withProposalViewSelection(project, [kitchen]);
    expect(proposalViewToggleLock(only, kitchen)).toBe("last-view");
    expect(toggleProposalView(only, kitchen)).toEqual([kitchen]);
    expect(proposalViewSelection(setProposalSelectedViews(only, toggleProposalView(only, kitchen))).selectedIds)
      .toEqual([kitchen]);
    expect(proposalViewToggleLock(only, cameraId("Guest Bath Showcase"))).toBeNull();
  });

  it("stops ticking at the print limit instead of silently dropping the new view", () => {
    const { availableIds } = proposalViewSelection(project);
    const full = withProposalViewSelection(project, availableIds.slice(0, PROPOSAL_VIEW_SELECTION_LIMIT));
    const extra = availableIds[PROPOSAL_VIEW_SELECTION_LIMIT]!;
    expect(proposalViewToggleLock(full, extra)).toBe("limit");
    expect(toggleProposalView(full, extra)).toHaveLength(PROPOSAL_VIEW_SELECTION_LIMIT);
    expect(toggleProposalView(full, extra)).not.toContain(extra);
    expect(proposalViewToggleLock(full, availableIds[0]!)).toBeNull();
  });

  it("fingerprints only the printed views", () => {
    const base = createQuoteDesignFingerprint(project);
    expect(createQuoteDesignFingerprint(moveCamera(project, cameraId("Guest Bath Showcase")))).toBe(base);
    expect(createQuoteDesignFingerprint(moveCamera(project, cameraId("Kitchen Showcase")))).not.toBe(base);
  });
});
