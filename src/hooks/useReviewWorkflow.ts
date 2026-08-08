import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import {
  clampJobMeta,
  patchJobMeta,
  type ProjectJobMeta,
} from "../domain/jobMeta";
import {
  addReviewNote,
  applyReviewStateToProject,
  approveProjectReview,
  createRevisionSnapshot,
  exportRevisionSummaryPdf,
  getProjectReviewState,
  releaseForProduction,
  setReviewNoteResolved,
  type ReviewNoteSeverity,
} from "../domain/projectReview";
import { createQuoteSnapshotFromQuote } from "../domain/projectQuote";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { createProjectReport } from "../domain/projectReport";
import { blobToBase64 } from "../utils/blobBase64";
import { getErrorMessage } from "../utils/errors";
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
    const snapshot = createQuoteSnapshotFromQuote(projectReport.quote);
    commitProjectChange(
      (currentProject) => {
        const nextHistory = [snapshot, ...(currentProject.quoteHistory ?? [])].slice(
          0,
          12,
        );
        const shouldMarkQuoted =
          !currentProject.job?.status || currentProject.job.status === "draft";
        return {
          project: {
            ...currentProject,
            quoteHistory: nextHistory,
            job: shouldMarkQuoted
              ? patchJobMeta(currentProject.job, { status: "quoted" })
              : clampJobMeta(currentProject.job),
          },
        };
      },
      `Froze quote snapshot for revision ${snapshot.revision}.`,
    );
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

  function handleReleaseForProduction() {
    const result = releaseForProduction(project);
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
      const targetPath = await save({
        title: "Export Revision Summary PDF",
        defaultPath: "cabinet-revision-summary.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!targetPath) {
        onStatus("Revision summary export cancelled.");
        return;
      }
      const blob = await exportRevisionSummaryPdf(project);
      const base64 = await blobToBase64(blob);
      await invoke("save_binary_file", { path: targetPath, base64Data: base64 });
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
