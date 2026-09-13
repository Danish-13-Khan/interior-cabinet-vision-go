import { useMemo } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import { readPersonalPriceBook } from "../domain/priceBook";
import {
  adaptHandoffProject,
  approveEngineeringRevision,
  buildHandoffGate,
  buildHandoffSummary,
  canApproveEngineeringRevision,
  commitEngineeringHandoff,
  handoffRevisionApproved,
  hasHandoffSnapshotForRevision,
  mapHandoffSelection,
} from "../domain/livingRoom/handoff";
import { readProposalCommercial } from "../domain/livingRoom/proposal";
import { resolvePostHandoffBridge } from "../domain/engineerBridge";
import { useCommercialStorageRevision } from "./useCommercialStorageRevision";

type PatchDocument = (
  update: (current: InteriorProject) => InteriorProject,
  status: string,
  cabinetIds?: string[],
) => void;

export function useEngineeringHandoff(args: {
  project: InteriorProject | null;
  selectedInteriorObjectIds: string[];
  onPatchDocument: PatchDocument;
  onEnterEngineering: (cabinetIds: string[]) => void;
}) {
  const commercialRevision = useCommercialStorageRevision();
  const priceBook = readPersonalPriceBook();
  const priceBookKey = `${commercialRevision}:${JSON.stringify(priceBook)}`;
  const quoteOptions = { priceBook };
  const summary = useMemo(
    () => (args.project
      ? buildHandoffSummary(args.project, args.selectedInteriorObjectIds)
      : null),
    [args.project, args.selectedInteriorObjectIds],
  );
  const gate = useMemo(
    () => (args.project
      ? buildHandoffGate(args.project, args.selectedInteriorObjectIds, quoteOptions)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.project, args.selectedInteriorObjectIds, priceBookKey],
  );
  const canApprove = Boolean(
    args.project && canApproveEngineeringRevision(args.project, quoteOptions),
  );
  const revisionApproved = Boolean(args.project && handoffRevisionApproved(args.project));
  const sent = Boolean(
    args.project
    && hasHandoffSnapshotForRevision(args.project, readProposalCommercial(args.project).job.revision),
  );

  function approveRevision() {
    if (!args.project || !canApprove) return;
    args.onPatchDocument(
      (current) => approveEngineeringRevision(current, undefined, quoteOptions),
      "Approved revision for Engineering.",
    );
  }

  function sendToEngineering() {
    if (!args.project || !gate?.ready) return;
    const selected = args.selectedInteriorObjectIds;
    const next = commitEngineeringHandoff(args.project, selected, undefined, quoteOptions);
    const adapted = adaptHandoffProject(next);
    const cabinetIds = mapHandoffSelection(adapted.project, selected);
    args.onPatchDocument(() => next, "Sent design to Engineering.", cabinetIds);
    args.onEnterEngineering(cabinetIds);
  }

  const bridgeTarget = resolvePostHandoffBridge();
  return { summary, gate, canApprove, revisionApproved, sent, approveRevision, sendToEngineering, bridgeTarget };
}
