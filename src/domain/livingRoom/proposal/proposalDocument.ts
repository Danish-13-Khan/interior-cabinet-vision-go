import type { InteriorProject } from "../../interiorProject";
import { formatQuoteMoney } from "../../quoteSettings";
import { readProposalCommercial } from "./commercialState";
import { proposalFileName } from "./fileName";
import { buildLiveInteriorQuote } from "./liveQuote";
import {
  allocateClientCabinetPrices,
  clientProposalSummaryLines,
  proposalMaterialLines,
} from "./proposalClientPayload";
import { proposalExportViews } from "./proposalRevision";
import type { ProposalCabinetLine, ProposalDocument, ProposalMaterialLine } from "./types";

function resolveClientLines(
  document: InteriorProject,
  staleDisclosed: boolean,
): {
  cabinets: ProposalCabinetLine[];
  materials: ProposalMaterialLine[];
  views: ReturnType<typeof proposalExportViews>;
  summaryLines: Array<{ label: string; amount: number }>;
} {
  const live = buildLiveInteriorQuote(document);
  const frozen = live.frozen;
  const stored = readProposalCommercial(document).surface.frozenClient;
  const taxLabel = frozen?.taxLabel ?? live.quote.settings.taxLabel;
  const sellTotal = frozen?.sellTotal ?? live.quote.sellTotal;
  const matching = Boolean(stored && frozen && stored.snapshotId === frozen.id);
  const summaryLines = clientProposalSummaryLines({
    sellTotal,
    taxLabel,
    sourceLines: matching ? stored!.summaryLines : frozen?.summaryLines ?? live.quote.summaryCards,
  });
  if (matching) {
    return {
      cabinets: stored!.cabinets,
      materials: stored!.materials,
      views: proposalExportViews(document),
      summaryLines,
    };
  }
  if (staleDisclosed) {
    return {
      cabinets: [],
      materials: [],
      views: proposalExportViews(document),
      summaryLines,
    };
  }
  return {
    cabinets: allocateClientCabinetPrices(
      live.quote.cabinetLines.map((line) => ({
        mark: line.mark,
        name: line.cabinetName,
        sellPrice: line.sellPrice,
      })),
      sellTotal,
    ),
    materials: proposalMaterialLines(document),
    views: proposalExportViews(document),
    summaryLines,
  };
}

export function buildProposalDocument(
  document: InteriorProject,
  options: { now?: string; staleOverride?: boolean } = {},
): ProposalDocument {
  const now = options.now ?? new Date().toISOString();
  const live = buildLiveInteriorQuote(document, now);
  const frozen = live.frozen;
  const draft = !frozen;
  const staleDisclosed = Boolean(frozen && live.stale && options.staleOverride);
  const settings = live.quote.settings;
  const job = live.quote.job;
  const snapshotId = frozen?.id ?? "draft";
  const client = resolveClientLines(document, staleDisclosed);
  return {
    brand: "Cabinet Studio",
    customerName: frozen?.customerName || job.customerName,
    projectNumber: frozen?.projectNumber || job.projectNumber,
    projectName: document.name,
    roomName: (document.rooms.find((item) => item.id === document.activeRoomId)
      ?? document.rooms[0])?.name ?? "Room",
    revision: frozen?.revision ?? job.revision,
    proposalDate: frozen?.quotedAt ?? now,
    validUntil: frozen?.validUntil ?? live.quote.validUntil,
    quoteSnapshotId: snapshotId,
    sellTotal: frozen?.sellTotal ?? live.quote.sellTotal,
    currencyLabel: frozen?.currencyLabel ?? settings.currencyLabel,
    taxLabel: frozen?.taxLabel ?? settings.taxLabel,
    priceDetail: frozen?.priceDetail ?? settings.priceDetail,
    draft,
    staleDisclosed,
    views: client.views,
    materials: client.materials,
    cabinets: client.cabinets,
    summaryLines: client.summaryLines,
    inclusions: frozen?.inclusions ?? settings.inclusions,
    exclusions: frozen?.exclusions ?? settings.exclusions,
    fileName: proposalFileName({
      projectNumber: frozen?.projectNumber || job.projectNumber,
      projectName: document.name,
      revision: frozen?.revision ?? job.revision,
      quoteSnapshotId: snapshotId,
      draft,
    }),
  };
}

export function formatProposalMoney(document: ProposalDocument, amount: number) {
  return formatQuoteMoney(amount, document.currencyLabel);
}
