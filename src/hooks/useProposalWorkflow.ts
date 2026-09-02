import { useMemo, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import type { ProjectJobMeta } from "../domain/jobMeta";
import type { QuoteSettings } from "../domain/quoteSettings";
import type { LivingRoomPlanIssue, LivingRoomRenderResult } from "../domain/livingRoom";
import {
  buildLiveInteriorQuote,
  buildProposalGate,
  buildProposalDocument,
  collectProposalViewFrames,
  exportInteriorProposalPdf,
  freezeProposal,
  listProposalNamedViews,
  matchingProposalRelease,
  patchProposalJob,
  patchProposalQuoteSettings,
  proposalExportCommit,
  recordProposalRelease,
  setProposalSelectedViews,
  setProposalStaleOverride,
  toggleProposalView,
} from "../domain/livingRoom/proposal";
import type { AcceptedStillAsset } from "./selectPackageAcceptedStillAssets";
import { getErrorMessage } from "../utils/errors";
import { promptSavePath, writeBinaryBlob } from "../platform/desktopFiles";

type PatchDocument = (
  update: (current: InteriorProject) => InteriorProject,
  status: string,
  cabinetIds?: string[],
) => void;

export function useProposalWorkflow(args: {
  project: InteriorProject | null;
  issues: LivingRoomPlanIssue[];
  onPatchDocument: PatchDocument;
  latestRender?: LivingRoomRenderResult | null;
  acceptedStills?: AcceptedStillAsset[];
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [staleOverride, setStaleOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const live = useMemo(
    () => (args.project ? buildLiveInteriorQuote(args.project) : null),
    [args.project],
  );
  const views = useMemo(
    () => (args.project ? listProposalNamedViews(args.project) : []),
    [args.project],
  );
  const viewFrames = useMemo(
    () => (args.project
      ? collectProposalViewFrames(args.project, {
          latestRender: args.latestRender,
          acceptedStills: args.acceptedStills,
        })
      : []),
    [args.project, args.latestRender, args.acceptedStills],
  );
  const gate = useMemo(
    () => (args.project
      ? buildProposalGate({
          document: args.project,
          issues: args.issues,
          staleOverride,
          overrideReason,
          viewFrames,
          acceptedStillCount: args.acceptedStills?.length ?? 0,
        })
      : null),
    [args.project, args.issues, staleOverride, overrideReason, viewFrames, args.acceptedStills],
  );

  function patchQuote(patch: Partial<QuoteSettings>) {
    args.onPatchDocument(
      (current) => patchProposalQuoteSettings(current, patch),
      "Updated commercial settings.",
    );
  }

  function patchJob(patch: Partial<ProjectJobMeta>) {
    args.onPatchDocument(
      (current) => patchProposalJob(current, patch),
      "Updated proposal identity.",
    );
  }

  function freezeQuote() {
    args.onPatchDocument((current) => freezeProposal(current), "Froze quote snapshot.");
    setStaleOverride(false);
    setOverrideReason("");
    setStatus("Quote frozen for this revision.");
  }

  function toggleView(cameraId: string) {
    args.onPatchDocument((current) => {
      const named = listProposalNamedViews(current);
      return setProposalSelectedViews(
        current,
        toggleProposalView(
          named.filter((view) => view.selected).map((view) => view.cameraId),
          named.map((view) => view.cameraId),
          cameraId,
        ),
      );
    }, "Updated proposal views.");
  }

  async function createProposal() {
    if (!args.project || !gate?.ready) return;
    setBusy(true);
    setStatus("");
    try {
      const proposalDoc = buildProposalDocument(args.project, { staleOverride });
      const blob = await exportInteriorProposalPdf(args.project, viewFrames, { staleOverride });
      const path = await promptSavePath({
        title: "Create Proposal",
        defaultPath: proposalDoc.fileName,
        extensions: ["pdf"],
      });
      if (!path) {
        setStatus("Proposal export cancelled. The project was not changed.");
        return;
      }
      await writeBinaryBlob(path, blob);
      const commit = proposalExportCommit({
        saved: true,
        staleOverride,
        frozen: live?.frozen ?? null,
        reason: overrideReason,
      });
      args.onPatchDocument((current) => {
        let next = recordProposalRelease(current);
        if (commit.persistOverride && commit.override) {
          next = setProposalStaleOverride(next, commit.override);
        }
        return next;
      }, "Proposal PDF saved.");
      setStatus("Proposal PDF saved.");
    } catch (error) {
      setStatus(`Proposal failed: ${getErrorMessage(error)}. The project was preserved.`);
    } finally {
      setBusy(false);
    }
  }

  const released = Boolean(args.project && matchingProposalRelease(args.project).ok);

  return {
    live,
    views,
    gate,
    released,
    status,
    busy,
    staleOverride,
    setStaleOverride,
    overrideReason,
    setOverrideReason,
    patchQuote,
    patchJob,
    freezeQuote,
    toggleView,
    createProposal,
  };
}
