import { useMemo } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  adaptHandoffProject,
  approveEngineeringRevision,
  buildHandoffGate,
  buildHandoffSummary,
  canApproveEngineeringRevision,
  commitEngineeringHandoff,
  handoffRevisionApproved,
  mapHandoffSelection,
} from "../domain/livingRoom/handoff";

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
  const summary = useMemo(
    () => (args.project
      ? buildHandoffSummary(args.project, args.selectedInteriorObjectIds)
      : null),
    [args.project, args.selectedInteriorObjectIds],
  );
  const gate = useMemo(
    () => (args.project ? buildHandoffGate(args.project, args.selectedInteriorObjectIds) : null),
    [args.project, args.selectedInteriorObjectIds],
  );
  const canApprove = Boolean(args.project && canApproveEngineeringRevision(args.project));
  const revisionApproved = Boolean(args.project && handoffRevisionApproved(args.project));

  function approveRevision() {
    if (!args.project || !canApprove) return;
    args.onPatchDocument(
      (current) => approveEngineeringRevision(current),
      "Approved revision for Engineering.",
    );
  }

  function sendToEngineering() {
    if (!args.project || !gate?.ready) return;
    const selected = args.selectedInteriorObjectIds;
    const next = commitEngineeringHandoff(args.project, selected);
    const adapted = adaptHandoffProject(next);
    const cabinetIds = mapHandoffSelection(adapted.project, selected);
    args.onPatchDocument(() => next, "Sent design to Engineering.", cabinetIds);
    args.onEnterEngineering(cabinetIds);
  }

  return { summary, gate, canApprove, revisionApproved, approveRevision, sendToEngineering };
}
