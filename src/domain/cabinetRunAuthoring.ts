import {
  cabinetTypeLabels,
  clampCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
  type CabinetType,
} from "./cabinetDimensions";
import { withNewCabinetIdentity } from "./cabinetIdentity/copyInstance";
import {
  getRunExtent,
  orderedRunCabinets,
  type CabinetRun,
  type CabinetRunBand,
} from "./cabinetRuns";

export type RunAuthoringGap = {
  afterCabinetId: string;
  beforeCabinetId: string;
  widthMm: number;
};

export type RunAuthoringModel = {
  members: CabinetInstance[];
  spanMm: number;
  occupiedMm: number;
  gaps: RunAuthoringGap[];
  overlapCount: number;
  countertopBreakCount: number;
  canSplitActive: boolean;
  replacementTypes: CabinetType[];
  health: "ready" | "open" | "blocked";
};

const REPLACEMENTS_BY_BAND: Record<CabinetRunBand, CabinetType[]> = {
  base: ["base", "drawer", "sink", "open-shelf"],
  wall: ["wall"],
  tall: ["tall", "almirah"],
};

export function replacementTypesForRun(band: CabinetRunBand): CabinetType[] {
  return REPLACEMENTS_BY_BAND[band];
}

export function createRunAuthoringModel(options: {
  project: CabinetProject;
  run: CabinetRun | null;
  activeCabinetId: string | null;
}): RunAuthoringModel {
  const { project, run, activeCabinetId } = options;
  if (!run) {
    return {
      members: [],
      spanMm: 0,
      occupiedMm: 0,
      gaps: [],
      overlapCount: 0,
      countertopBreakCount: 0,
      canSplitActive: false,
      replacementTypes: [],
      health: "open",
    };
  }

  const members = orderedRunCabinets(run.cabinetIds, project.cabinets, run.axis);
  const gaps: RunAuthoringGap[] = [];
  let overlapCount = 0;
  for (let index = 0; index < members.length - 1; index += 1) {
    const current = members[index]!;
    const next = members[index + 1]!;
    const widthMm = Math.round(
      getRunExtent(next, run.axis).start - getRunExtent(current, run.axis).end,
    );
    if (widthMm < 0) overlapCount += 1;
    else if (widthMm > 1) {
      gaps.push({
        afterCabinetId: current.id,
        beforeCabinetId: next.id,
        widthMm,
      });
    }
  }

  const first = members[0];
  const last = members[members.length - 1];
  const spanMm = first && last
    ? Math.round(getRunExtent(last, run.axis).end - getRunExtent(first, run.axis).start)
    : 0;
  const occupiedMm = Math.round(
    members.reduce(
      (total, cabinet) => {
        const extent = getRunExtent(cabinet, run.axis);
        return total + extent.end - extent.start;
      },
      0,
    ),
  );
  const active = members.find((cabinet) => cabinet.id === activeCabinetId);

  return {
    members,
    spanMm,
    occupiedMm,
    gaps,
    overlapCount,
    countertopBreakCount: members.filter(
      (cabinet) => cabinet.config.countertopBreakAfter,
    ).length,
    canSplitActive: Boolean(active && active.config.dimensions.width >= 1000),
    replacementTypes: replacementTypesForRun(run.band),
    health: overlapCount > 0 ? "blocked" : gaps.length > 0 ? "open" : "ready",
  };
}

export function replaceCabinetFamily(
  cabinet: CabinetInstance,
  replacement: CabinetConfigSeed,
): CabinetInstance {
  const config = clampCabinetConfig({
    ...replacement.config,
    dimensions: {
      ...replacement.config.dimensions,
      width: cabinet.config.dimensions.width,
    },
    buildRules: cabinet.config.buildRules,
    leftEndPanel: cabinet.config.leftEndPanel,
    rightEndPanel: cabinet.config.rightEndPanel,
    countertopBreakAfter: cabinet.config.countertopBreakAfter,
  });
  return {
    ...cabinet,
    name: cabinetTypeLabels[config.type],
    config,
  };
}

type CabinetConfigSeed = {
  config: CabinetInstance["config"];
};

export function splitCabinetInRun(options: {
  cabinet: CabinetInstance;
  run: CabinetRun;
  firstId: string;
  secondId: string;
}): [CabinetInstance, CabinetInstance] | null {
  const { cabinet, run, firstId, secondId } = options;
  const originalWidth = cabinet.config.dimensions.width;
  if (originalWidth < 1000) return null;

  const firstWidth = Math.round(originalWidth / 20) * 10;
  const secondWidth = originalWidth - firstWidth;
  const firstConfig = clampCabinetConfig({
    ...cabinet.config,
    dimensions: { ...cabinet.config.dimensions, width: firstWidth },
    rightEndPanel: false,
    countertopBreakAfter: false,
  });
  const secondConfig = clampCabinetConfig({
    ...cabinet.config,
    dimensions: { ...cabinet.config.dimensions, width: secondWidth },
    leftEndPanel: false,
  });
  const firstPrimary =
    (run.axis === "x" ? cabinet.placement.x : cabinet.placement.z) - secondWidth / 2;
  const secondPrimary =
    (run.axis === "x" ? cabinet.placement.x : cabinet.placement.z) + firstWidth / 2;

  return [
    {
      ...withNewCabinetIdentity(cabinet, firstId),
      name: `${cabinet.name} A`,
      placement: {
        ...cabinet.placement,
        ...(run.axis === "x" ? { x: firstPrimary } : { z: firstPrimary }),
      },
      config: firstConfig,
    },
    {
      ...withNewCabinetIdentity(cabinet, secondId),
      name: `${cabinet.name} B`,
      placement: {
        ...cabinet.placement,
        ...(run.axis === "x" ? { x: secondPrimary } : { z: secondPrimary }),
      },
      config: secondConfig,
    },
  ];
}
