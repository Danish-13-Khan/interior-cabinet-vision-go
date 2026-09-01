import type { InteriorProject } from "../../interiorProject";
import { buildLivingRoomMillworkSchedule } from "../millworkSchedule";
import { buildLiveInteriorQuote } from "./liveQuote";
import { liveProposalSceneBinding } from "./proposalRevision";
import { selectedProposalViews } from "./proposalViews";
import type {
  ProposalCabinetLine,
  ProposalClientPayload,
  ProposalMaterialLine,
} from "./types";

const INTERNAL_SUMMARY = /workshop|markup|finish premium|labour|labor|hardware allowance|base before|cabinets and hardware|quote total/i;

export function clientProposalSummaryLines(input: {
  sellTotal: number;
  taxLabel: string;
  sourceLines?: Array<{ label: string; amount: number }>;
}): Array<{ label: string; amount: number }> {
  const lines: Array<{ label: string; amount: number }> = [];
  for (const line of input.sourceLines ?? []) {
    const label = line.label.trim();
    if (!label || INTERNAL_SUMMARY.test(label) || line.amount === 0) continue;
    if (/^discount$/i.test(label)) {
      lines.push({ label: "Discount", amount: line.amount });
    } else if (/^tax\b/i.test(label) || label.toLowerCase() === input.taxLabel.toLowerCase()) {
      lines.push({ label: input.taxLabel, amount: line.amount });
    }
  }
  lines.push({ label: "Total", amount: input.sellTotal });
  return lines;
}

export function allocateClientCabinetPrices(
  cabinets: ProposalCabinetLine[],
  sellTotal: number,
): ProposalCabinetLine[] {
  if (!cabinets.length) return [];
  const weights = cabinets.map((line) => Math.max(0, line.sellPrice) || 1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = Math.round(sellTotal);
  return cabinets.map((line, index) => {
    const amount = index === cabinets.length - 1
      ? remaining
      : Math.round((weights[index]! / weightSum) * sellTotal);
    remaining -= amount;
    return { ...line, sellPrice: amount };
  });
}

const CLIENT_MATERIAL_ROLES: Record<string, string> = {
  carcass: "Cabinet body",
  fronts: "Fronts",
  countertop: "Countertop",
  back: "Back",
  shelves: "Shelves",
};

export function proposalMaterialLines(document: InteriorProject): ProposalMaterialLine[] {
  const seen = new Map<string, ProposalMaterialLine>();
  for (const line of buildLivingRoomMillworkSchedule(document).lines) {
    for (const [slot, name] of Object.entries(line.materialLabels)) {
      const role = CLIENT_MATERIAL_ROLES[slot] ?? slot;
      const key = `${role}:${name}`;
      if (!seen.has(key)) seen.set(key, { name, kind: slot, role });
    }
  }
  return [...seen.values()].slice(0, 12);
}

export function buildProposalClientPayload(
  document: InteriorProject,
  snapshotId: string,
): ProposalClientPayload {
  const live = buildLiveInteriorQuote(document);
  const cabinets = allocateClientCabinetPrices(
    live.quote.cabinetLines.map((line) => ({
      mark: line.mark,
      name: line.cabinetName,
      sellPrice: line.sellPrice,
    })),
    live.quote.sellTotal,
  );
  const scene = liveProposalSceneBinding(document);
  return {
    snapshotId,
    cabinets,
    materials: proposalMaterialLines(document),
    views: selectedProposalViews(document),
    summaryLines: clientProposalSummaryLines({
      sellTotal: live.quote.sellTotal,
      taxLabel: live.quote.settings.taxLabel,
      sourceLines: live.quote.summaryCards,
    }),
    sceneFingerprint: scene.sceneFingerprint,
    projectContentHash: scene.projectContentHash,
  };
}
