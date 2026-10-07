import type { InteriorProject } from "../../interiorProject";
import { buildLivingRoomMillworkSchedule } from "../millworkSchedule";
import { buildLiveInteriorQuote } from "./liveQuote";
import type { LiveQuoteOptions } from "./liveQuoteOptions";
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
  const rawWeights = cabinets.map((line) => Math.max(0, line.sellPrice));
  const weights = rawWeights.some(value => value > 0) ? rawWeights : rawWeights.map(() => 1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  // Cumulative rounding conserves the total without assigning a remainder to a free item.
  let cumulative = 0, allocated = 0;
  return cabinets.map((line, index) => {
    cumulative += weights[index];
    const target = Math.round(cumulative / weightSum * sellTotal);
    const amount = target - allocated;
    allocated = target;
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

/** One line per finish and role, with its swatch colour and the rooms it is used in (finish board, room pages). */
export function proposalMaterialLines(document: InteriorProject): ProposalMaterialLine[] {
  const seen = new Map<string, ProposalMaterialLine>();
  const materialColor = new Map(document.materials.map((material) => [material.id, material.color]));
  const roomName = new Map(document.rooms.map((room) => [room.id, room.name]));
  for (const line of buildLivingRoomMillworkSchedule(document).lines) {
    for (const [slot, name] of Object.entries(line.materialLabels)) {
      const role = CLIENT_MATERIAL_ROLES[slot] ?? (slot.charAt(0).toUpperCase() + slot.slice(1));
      // "back" and "Back" are the same role to the client; one line per finish and role.
      const key = `${role.toLowerCase()}:${name.trim().toLowerCase()}`;
      let entry = seen.get(key);
      if (!entry) {
        const color = materialColor.get(line.materialSlots[slot] ?? "");
        entry = { name, kind: slot, role, ...(color ? { color } : {}), rooms: [] };
        seen.set(key, entry);
      }
      const room = roomName.get(line.roomId);
      if (room && !entry.rooms!.includes(room)) entry.rooms!.push(room);
    }
  }
  return [...seen.values()].slice(0, 12);
}

export function buildProposalClientPayload(
  document: InteriorProject,
  snapshotId: string,
  options: LiveQuoteOptions = {},
): ProposalClientPayload {
  const live = buildLiveInteriorQuote(document, undefined, options);
  const cabinets = allocateClientCabinetPrices(
    [...live.quote.cabinetLines.map((line) => ({
      mark: line.mark,
      name: line.cabinetName,
      sellPrice: line.sellPrice,
    })), ...(live.quote.interiorLines ?? []).map((line, index) => ({ mark: `I${index + 1}`, name: line.label, sellPrice: line.amount }))],
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
