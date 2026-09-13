import {
  patchJobMeta,
  type ProjectJobMeta,
} from "../domain/jobMeta";
import {
  addReviewNote,
  applyReviewStateToProject,
  approveProjectReview,
  createRevisionSnapshot,
  exportRevisionSummaryPdf,
  gateOverrideFromReason,
  getProjectReviewState,
  releaseForProduction,
  setReviewNoteResolved,
  type ReviewNoteSeverity,
} from "../domain/projectReview";
import { gateFreezeQuotes } from "../domain/quoteExport";
import { readPersonalPriceBook } from "../domain/priceBook";
import { getAccountView } from "../domain/saas";
import { syncFrozenQuoteToLedger } from "../domain/paymentLedger";
import { prepareCabinetFreezeForLedger } from "./freezeQuoteAndSyncLedger";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { createProjectReport } from "../domain/projectReport";
import { getErrorMessage } from "../utils/errors";
import { promptSavePath, writeBinaryBlob } from "../platform/desktopFiles";
import type { CommitProjectChange } from "./projectCommit";

type ProjectReport = ReturnType<typeof createProjectReport>;

type UseReviewWorkflowArgs = {
  project: CabinetProject;
  projectReport: ProjectReport;
  commitProjectChange: CommitProjectChange;
  onStatus: (status: string) => void;
};

export function useReviewWorkflow({
  project,
  projectReport,
  commitProjectChange,
  onStatus,
}: UseReviewWorkflowArgs) {
  function handleJobMetaChange(patch: Partial<ProjectJobMeta>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          job: patchJobMeta(currentProject.job, patch),
        },
      }),
      "Updated job workflow.",
    );
  }

  function handleFreezeQuoteSnapshot() {
    const entitlements = getAccountView().entitlements;
    const gate = gateFreezeQuotes(entitlements);
    if (!gate.ok) {
      onStatus(gate.reason);
      return;
    }
    const priceBook = readPersonalPriceBook();
    let prepared: ReturnType<typeof prepareCabinetFreezeForLedger> | undefined;
    commitProjectChange(
      (currentProject) => {
        prepared = prepareCabinetFreezeForLedger({
          project: currentProject,
          quote: projectReport.quote,
          priceBook,
        });
        return { project: prepared.project };
      },
      "Froze quote snapshot.",
    );
    if (!prepared) return;
    if (prepared.ledgerRefuseReason) {
      onStatus(prepared.ledgerRefuseReason);
      return;
    }
    const sync = syncFrozenQuoteToLedger({
      projectId: prepared.projectId,
      snapshot: prepared.snapshot,
      actor: "owner",
    });
    if (!sync.ok) onStatus(sync.reason);
  }

  function handleFreezeRevision(note: string, bumpRevision: boolean) {
    commitProjectChange(
      (currentProject) => {
        const frozen = createRevisionSnapshot(currentProject, {
          note,
          bumpRevision,
        });
        return {
          project: applyReviewStateToProject(
            currentProject,
            frozen.nextReview,
            frozen.nextJob,
          ),
        };
      },
      `Froze revision snapshot${bumpRevision ? " and bumped revision" : ""}.`,
    );
  }

  function handleAddReviewNote(message: string, severity: ReviewNoteSeverity) {
    commitProjectChange((currentProject) => {
      const review = addReviewNote(getProjectReviewState(currentProject), {
        message,
        severity,
      });
      return {
        project: applyReviewStateToProject(currentProject, review),
      };
    }, "Added review note.");
  }

  function handleResolveReviewNote(noteId: string, resolved: boolean) {
    commitProjectChange((currentProject) => {
      const review = setReviewNoteResolved(
        getProjectReviewState(currentProject),
        noteId,
        resolved,
      );
      return {
        project: applyReviewStateToProject(currentProject, review),
      };
    }, resolved ? "Resolved review note." : "Reopened review note.");
  }

  function handleApproveReview(approvedBy: string) {
    const result = approveProjectReview(project, approvedBy);
    if ("error" in result) {
      onStatus(`Approval blocked: ${result.error}`);
      return;
    }
    commitProjectChange(
      (currentProject) => ({
        project: applyReviewStateToProject(
          currentProject,
          result.review,
          result.job,
        ),
      }),
      "Project marked approved.",
    );
  }

  function handleReleaseForProduction(overrideReason = "") {
    const result = releaseForProduction(project, gateOverrideFromReason(overrideReason));
    if ("error" in result) {
      onStatus(`Release blocked: ${result.error}`);
      return;
    }
    commitProjectChange(
      (currentProject) => ({
        project: applyReviewStateToProject(
          currentProject,
          result.review,
          result.job,
        ),
      }),
      "Released for production.",
    );
  }

  async function handleExportRevisionSummary() {
    try {
      const targetPath = await promptSavePath({
        title: "Export Revision Summary PDF",
        defaultPath: "cabinet-revision-summary.pdf",
        extensions: ["pdf"],
      });
      if (!targetPath) {
        onStatus("Revision summary export cancelled.");
        return;
      }
      const blob = await exportRevisionSummaryPdf(project);
      await writeBinaryBlob(targetPath, blob);
      onStatus("Revision summary PDF saved.");
    } catch (error) {
      onStatus(`Revision summary failed: ${getErrorMessage(error)}`);
    }
  }

  return {
    handleJobMetaChange,
    handleFreezeQuoteSnapshot,
    handleFreezeRevision,
    handleAddReviewNote,
    handleResolveReviewNote,
    handleApproveReview,
    handleReleaseForProduction,
    handleExportRevisionSummary,
  };
}
