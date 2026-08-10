import {
  clampCabinetConfig,
  supportsCountertop,
  type CabinetInstance,
  type CabinetProject,
  type CabinetType,
  type RoomBounds,
} from "../domain/cabinetDimensions";
import {
  createAllRunAlignedPlacements,
  createCabinetPlanningWorkflow,
} from "../domain/cabinetLibrary";
import { orderedRunCabinets } from "../domain/cabinetRuns";
import {
  replacementTypesForRun,
  replaceCabinetFamily,
  splitCabinetInRun,
} from "../domain/cabinetRunAuthoring";
import { createConfigFromFamily } from "../domain/cabinetLibraryCatalog";
import { createCabinetId } from "../domain/cabinetIds";
import type { ProjectStandards } from "../domain/projectStandards";
import { normalizeCabinetHardware } from "../domain/hardwareSystem";
import type { WallLayoutSide } from "../domain/wallLayout";
import type { CommitProjectChange } from "./projectCommit";

type UseCabinetRunOpsArgs = {
  project: CabinetProject;
  roomBounds: RoomBounds;
  selectedCabinet: CabinetInstance | null;
  projectStandards: ProjectStandards;
  commitProjectChange: CommitProjectChange;
  isCabinetLocked: (cabinet: CabinetInstance) => boolean;
  onStatus: (status: string) => void;
};

export function useCabinetRunOps({
  project,
  roomBounds,
  selectedCabinet,
  projectStandards,
  commitProjectChange,
  isCabinetLocked,
  onStatus,
}: UseCabinetRunOpsArgs) {
  function activeRun() {
    if (!selectedCabinet) return null;
    return createCabinetPlanningWorkflow(project, roomBounds).runs.find((run) =>
      run.cabinetIds.includes(selectedCabinet.id),
    ) ?? null;
  }

  function handleReplaceCabinetInRun(type: CabinetType) {
    const cabinet = selectedCabinet;
    const run = activeRun();
    if (!cabinet || !run) {
      onStatus("Select a cabinet in a wall run before replacing it.");
      return;
    }
    if (isCabinetLocked(cabinet)) {
      onStatus("This cabinet is on a locked layer.");
      return;
    }
    if (!replacementTypesForRun(run.band).includes(type)) {
      onStatus("That family is not compatible with this run band.");
      return;
    }

    const replacement = replaceCabinetFamily(cabinet, {
      config: createConfigFromFamily(type, projectStandards),
    });
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((item) =>
            item.id === cabinet.id ? replacement : item,
          ),
        },
        selectedCabinetIds: [cabinet.id],
        activeCabinetId: cabinet.id,
        selectedPanelName: null,
      }),
      `Replaced the run member with ${replacement.name}.`,
    );
  }

  function handleSplitCabinetInRun() {
    const cabinet = selectedCabinet;
    const run = activeRun();
    if (!cabinet || !run) {
      onStatus("Select a cabinet in a wall run before splitting it.");
      return;
    }
    if (isCabinetLocked(cabinet)) {
      onStatus("This cabinet is on a locked layer.");
      return;
    }
    const pair = splitCabinetInRun({
      cabinet,
      run,
      firstId: createCabinetId(),
      secondId: createCabinetId(),
    });
    if (!pair) {
      onStatus("A cabinet must be at least 1000 mm wide to split safely.");
      return;
    }

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.flatMap((item) =>
            item.id === cabinet.id ? pair : [item],
          ),
        },
        selectedCabinetIds: pair.map((item) => item.id),
        activeCabinetId: pair[0].id,
        selectedPanelName: null,
      }),
      `Split ${cabinet.name} into two run members.`,
    );
  }

  function handleToggleCountertopBreak() {
    const cabinet = selectedCabinet;
    const run = activeRun();
    if (!cabinet || !run || run.band !== "base" || !supportsCountertop(cabinet.config.type)) {
      onStatus("Select a countertop-compatible base cabinet first.");
      return;
    }
    if (isCabinetLocked(cabinet)) {
      onStatus("This cabinet is on a locked layer.");
      return;
    }
    const enabled = !cabinet.config.countertopBreakAfter;
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((item) =>
            item.id === cabinet.id
              ? {
                  ...item,
                  config: clampCabinetConfig({
                    ...item.config,
                    countertopBreakAfter: enabled,
                  }),
                }
              : item,
          ),
        },
      }),
      enabled ? "Added a countertop break after the selected cabinet." : "Removed the countertop break.",
    );
  }

  function handleCompleteWallRuns(side: WallLayoutSide) {
    commitProjectChange(
      (currentProject) => {
        const workflow = createCabinetPlanningWorkflow(currentProject, roomBounds);
        const wallRuns = workflow.runs.filter((run) => run.side === side);
        if (wallRuns.length === 0) return null;
        const aligned = createAllRunAlignedPlacements(wallRuns, currentProject, roomBounds);
        const endFlags = new Map<string, { left: boolean; right: boolean }>();
        const wallRailCabinetIds = new Set<string>();
        for (const run of wallRuns) {
          const members = orderedRunCabinets(run.cabinetIds, currentProject.cabinets, run.axis);
          if (run.band === "wall") {
            for (const member of members) wallRailCabinetIds.add(member.id);
          }
          const first = members[0];
          const last = members[members.length - 1];
          if (first) endFlags.set(first.id, { left: true, right: first.id === last?.id });
          if (last) {
            endFlags.set(last.id, {
              left: endFlags.get(last.id)?.left ?? false,
              right: true,
            });
          }
        }

        return {
          project: {
            ...currentProject,
            cabinets: currentProject.cabinets.map((cabinet) => {
              const flags = endFlags.get(cabinet.id);
              const useWallRail = wallRailCabinetIds.has(cabinet.id);
              if (!flags && !useWallRail && !aligned[cabinet.id]) return cabinet;
              return {
                ...cabinet,
                placement: aligned[cabinet.id] ?? cabinet.placement,
                config: clampCabinetConfig({
                  ...cabinet.config,
                  ...(flags
                    ? {
                      leftEndPanel: flags.left || cabinet.config.leftEndPanel,
                      rightEndPanel: flags.right || cabinet.config.rightEndPanel,
                    }
                    : {}),
                  ...(useWallRail
                    ? {
                        hardware: {
                          ...normalizeCabinetHardware(
                            cabinet.config.type,
                            cabinet.config.hardware,
                          ),
                          bracketId: "wall-rail",
                        },
                      }
                    : {}),
                }),
              };
            }),
          },
        };
      },
      "Completed wall runs: packed members, finished exposed ends, and regenerated outputs.",
    );
  }

  return {
    handleReplaceCabinetInRun,
    handleSplitCabinetInRun,
    handleToggleCountertopBreak,
    handleCompleteWallRuns,
  };
}
