import {
  CABINET_GRID_SNAP_MM,
  defaultCabinetProject,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "../domain/costingSettings";
import {
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
} from "../domain/quoteSettings";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
} from "../domain/sheetStock";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "../domain/projectStandards";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  DEFAULT_DRAFTING,
  DEFAULT_DRAFTING_DISPLAY,
  type DraftingLeader,
  type DraftingNote,
} from "../domain/draftingAnnotations";
import {
  removeDimOffset,
  removeTagOffset,
  upsertDimOffset,
  upsertTagOffset,
} from "../domain/draftingEdit";
import type { CommitProjectChange } from "./projectCommit";

type UseProjectPreferencesArgs = {
  project: CabinetProject;
  commitProjectChange: CommitProjectChange;
  setDraftingTool: (tool: "select" | "note" | "leader") => void;
  onStatus: (status: string) => void;
};

export function useProjectPreferences({
  project,
  commitProjectChange,
  setDraftingTool,
  onStatus,
}: UseProjectPreferencesArgs) {
  function handleProjectPreferenceChange(
    patch: Partial<NonNullable<CabinetProject["preferences"]>>,
  ) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          preferences: {
            snapSizeMm:
              currentProject.preferences?.snapSizeMm ??
              defaultCabinetProject.preferences?.snapSizeMm ??
              CABINET_GRID_SNAP_MM,
            showGrid:
              currentProject.preferences?.showGrid ??
              defaultCabinetProject.preferences?.showGrid ??
              true,
            autoSaveToBrowser:
              currentProject.preferences?.autoSaveToBrowser ??
              defaultCabinetProject.preferences?.autoSaveToBrowser ??
              true,
            costing: clampCostingSettings(
              currentProject.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
            ),
            quote: clampQuoteSettings(
              currentProject.preferences?.quote ?? DEFAULT_QUOTE_SETTINGS,
            ),
            sheetOptimizer: clampSheetOptimizerSettings(
              currentProject.preferences?.sheetOptimizer ??
                DEFAULT_SHEET_OPTIMIZER,
            ),
            standards: clampProjectStandards(
              currentProject.preferences?.standards ??
                DEFAULT_PROJECT_STANDARDS,
            ),
            drafting: clampDraftingDisplay(
              currentProject.preferences?.drafting ?? DEFAULT_DRAFTING_DISPLAY,
            ),
            ...patch,
          },
        },
      }),
      "Updated project preferences.",
    );
  }

  function handleDraftingChange(next: ReturnType<typeof clampProjectDrafting>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          drafting: clampProjectDrafting(next),
        },
      }),
      "Updated drafting annotations.",
    );
  }

  function withDrafting(
    mutate: (current: ReturnType<typeof clampProjectDrafting>) => ReturnType<
      typeof clampProjectDrafting
    >,
    status?: string,
  ) {
    const current = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
    handleDraftingChange(mutate(current));
    if (status) onStatus(status);
  }

  function handleAddDraftingNote(note: DraftingNote) {
    withDrafting(
      (current) => ({ ...current, notes: [...current.notes, note] }),
      "Added drawing note.",
    );
    setDraftingTool("select");
  }

  function handleAddDraftingLeader(leader: DraftingLeader) {
    withDrafting(
      (current) => ({ ...current, leaders: [...current.leaders, leader] }),
      "Added leader callout.",
    );
    setDraftingTool("select");
  }

  function handleUpdateDraftingNote(note: DraftingNote) {
    withDrafting((current) => ({
      ...current,
      notes: current.notes.map((item) => (item.id === note.id ? note : item)),
    }));
  }

  function handleUpdateDraftingLeader(leader: DraftingLeader) {
    withDrafting((current) => ({
      ...current,
      leaders: current.leaders.map((item) =>
        item.id === leader.id ? leader : item,
      ),
    }));
  }

  function handleDeleteDraftingNote(id: string) {
    withDrafting(
      (current) => ({
        ...current,
        notes: current.notes.filter((item) => item.id !== id),
      }),
      "Deleted note.",
    );
  }

  function handleDeleteDraftingLeader(id: string) {
    withDrafting(
      (current) => ({
        ...current,
        leaders: current.leaders.filter((item) => item.id !== id),
      }),
      "Deleted leader.",
    );
  }

  function handleUpsertDimOffset(id: string, dx: number, dy: number) {
    withDrafting((current) => ({
      ...current,
      dimOffsets: upsertDimOffset(current.dimOffsets, { id, dx, dy }),
    }));
  }

  function handleResetDimOffset(id: string) {
    withDrafting(
      (current) => ({
        ...current,
        dimOffsets: removeDimOffset(current.dimOffsets, id),
      }),
      "Reset dimension anchor.",
    );
  }

  function handleUpsertTagOffset(cabinetId: string, dx: number, dy: number) {
    withDrafting((current) => ({
      ...current,
      tagOffsets: upsertTagOffset(current.tagOffsets, { cabinetId, dx, dy }),
    }));
  }

  function handleResetTagOffset(cabinetId: string) {
    withDrafting(
      (current) => ({
        ...current,
        tagOffsets: removeTagOffset(current.tagOffsets, cabinetId),
      }),
      "Reset cabinet tag.",
    );
  }

  return {
    handleProjectPreferenceChange,
    handleDraftingChange,
    handleAddDraftingNote,
    handleAddDraftingLeader,
    handleUpdateDraftingNote,
    handleUpdateDraftingLeader,
    handleDeleteDraftingNote,
    handleDeleteDraftingLeader,
    handleUpsertDimOffset,
    handleResetDimOffset,
    handleUpsertTagOffset,
    handleResetTagOffset,
  };
}
