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

  function handleAddDraftingNote(note: DraftingNote) {
    const current = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
    handleDraftingChange({
      ...current,
      notes: [...current.notes, note],
    });
    setDraftingTool("select");
    onStatus("Added drawing note.");
  }

  function handleAddDraftingLeader(leader: DraftingLeader) {
    const current = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
    handleDraftingChange({
      ...current,
      leaders: [...current.leaders, leader],
    });
    setDraftingTool("select");
    onStatus("Added leader callout.");
  }

  return {
    handleProjectPreferenceChange,
    handleDraftingChange,
    handleAddDraftingNote,
    handleAddDraftingLeader,
  };
}
