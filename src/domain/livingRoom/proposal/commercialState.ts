import {
  clampJobMeta,
  createDefaultJobMeta,
  patchJobMeta,
  type ProjectJobMeta,
} from "../../jobMeta";
import {
  clampQuoteHistory,
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
  MAX_QUOTE_HISTORY,
  type QuoteSettings,
  type QuoteSnapshot,
} from "../../quoteSettings";
import type { InteriorProject } from "../../interiorProject";
import { CABINET_EXTENSION } from "../../interiorProject/cabinetAdapterShared";
import { readProposalSurface } from "./proposalSurface";
import type {
  ProposalClientPayload,
  ProposalStaleOverride,
  ProposalSurfaceState,
} from "./types";

export const PROPOSAL_EXTENSION = "proposalSurface";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readShell(document: InteriorProject): Record<string, unknown> {
  const planning = asRecord(document.extensions?.[CABINET_EXTENSION]);
  return asRecord(planning?.projectShell) ?? {};
}

function readSurface(document: InteriorProject): ProposalSurfaceState {
  return readProposalSurface(asRecord(document.extensions?.[PROPOSAL_EXTENSION]));
}

export function readProposalCommercial(
  document: InteriorProject,
): {
  quote: QuoteSettings;
  job: ProjectJobMeta;
  quoteHistory: QuoteSnapshot[];
  surface: ProposalSurfaceState;
} {
  const shell = readShell(document);
  const preferences = asRecord(shell.preferences);
  return {
    quote: clampQuoteSettings(
      (preferences?.quote as Partial<QuoteSettings> | undefined) ?? DEFAULT_QUOTE_SETTINGS,
    ),
    job: clampJobMeta((shell.job as Partial<ProjectJobMeta> | undefined) ?? createDefaultJobMeta()),
    quoteHistory: clampQuoteHistory(shell.quoteHistory as QuoteSnapshot[] | undefined),
    surface: readSurface(document),
  };
}

export function writeProposalCommercial(
  document: InteriorProject,
  patch: {
    quote?: QuoteSettings;
    job?: ProjectJobMeta;
    quoteHistory?: QuoteSnapshot[];
    surface?: ProposalSurfaceState;
  },
): InteriorProject {
  const current = readProposalCommercial(document);
  const shell = readShell(document);
  const preferences = asRecord(shell.preferences) ?? {};
  const nextSurface = patch.surface ?? current.surface;
  return {
    ...document,
    extensions: {
      ...document.extensions,
      [CABINET_EXTENSION]: {
        projectShell: {
          ...shell,
          version: typeof shell.version === "number" ? shell.version : 1,
          preferences: {
            ...preferences,
            quote: patch.quote ?? current.quote,
          },
          job: patch.job ?? current.job,
          quoteHistory: patch.quoteHistory ?? current.quoteHistory,
        },
      },
      [PROPOSAL_EXTENSION]: {
        selectedViewCameraIds: nextSurface.selectedViewCameraIds,
        staleOverride: nextSurface.staleOverride,
        frozenClient: nextSurface.frozenClient,
        proposalRelease: nextSurface.proposalRelease,
      },
    },
  };
}

export function patchProposalQuoteSettings(
  document: InteriorProject,
  patch: Partial<QuoteSettings>,
): InteriorProject {
  const current = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    quote: clampQuoteSettings({ ...current.quote, ...patch }),
  });
}

export function patchProposalJob(
  document: InteriorProject,
  patch: Partial<ProjectJobMeta>,
): InteriorProject {
  const current = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    job: patchJobMeta(current.job, patch),
  });
}

function jobAfterNewFreeze(job: ProjectJobMeta, previousSnapshotId: string | undefined, snapshotId: string) {
  if (previousSnapshotId === snapshotId) return job;
  if (job.status === "approved" || job.status === "production") {
    return patchJobMeta(job, {
      status: "quoted",
      approvedAt: undefined,
      productionAt: undefined,
    });
  }
  if (job.status === "draft") return patchJobMeta(job, { status: "quoted" });
  return job;
}

export function appendFrozenQuote(
  document: InteriorProject,
  snapshot: QuoteSnapshot,
  frozenClient?: ProposalClientPayload | null,
): InteriorProject {
  const current = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    quoteHistory: [snapshot, ...current.quoteHistory].slice(0, MAX_QUOTE_HISTORY),
    job: jobAfterNewFreeze(current.job, current.quoteHistory[0]?.id, snapshot.id),
    surface: {
      ...current.surface,
      staleOverride: null,
      frozenClient: frozenClient ?? current.surface.frozenClient,
    },
  });
}

export function setProposalSelectedViews(
  document: InteriorProject,
  cameraIds: string[],
): InteriorProject {
  const current = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    surface: { ...current.surface, selectedViewCameraIds: cameraIds.slice(0, 12) },
  });
}

export function setProposalStaleOverride(
  document: InteriorProject,
  override: ProposalStaleOverride | null,
): InteriorProject {
  const current = readProposalCommercial(document);
  return writeProposalCommercial(document, {
    surface: { ...current.surface, staleOverride: override },
  });
}
