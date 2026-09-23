import { cabinetProjectFromInteriorProject } from "../../src/domain/interiorProject";
import {
  buildLiveInteriorQuote,
  freezeLiveQuote,
} from "../../src/domain/livingRoom/proposal";
import {
  designedAndRated,
  fillMissingCategoryRates,
  ledgerIdAfterAdapter,
  placeSmokeMillwork,
} from "../../src/domain/livingRoom/proposal/designToFreezeSmoke.helpers";
import { createEmptyLedger } from "../../src/domain/paymentLedger/empty";
import { computeDocumentBalances } from "../../src/domain/paymentLedger/outstanding";
import { recordPayment } from "../../src/domain/paymentLedger/recordPayment";
import { setPaymentSchedule } from "../../src/domain/paymentLedger/schedule";
import { registerCommercialDocFromFreeze } from "../../src/domain/paymentLedger/syncFreezeToLedger";
import { proGate } from "../../src/domain/paymentLedger/testFixtures";
import { csvFromProductionCutlist } from "../../src/domain/productionCutlist";
import { createExportableProjectCutlist } from "../../src/domain/productionOutputs";
import { csvFromFrozenSnapshot, csvFromProjectQuote } from "../../src/domain/quoteExport/csvRows";
import { STAGE1_NOW } from "./constants";
import { writeJson, writeText } from "./output";

const PROJECT_ID = "stage1-cabinet-commercial";
const SNAPSHOT_ID = "stage1-cabinet-snap-1";

export function cabinetCommercialProject() {
  const started = designedAndRated(PROJECT_ID);
  const project = fillMissingCategoryRates(placeSmokeMillwork(started.project), started.book);
  return { project, book: started.book };
}

export function writeCommercialSamples() {
  const { project, book } = cabinetCommercialProject();
  const adapted = cabinetProjectFromInteriorProject(project).project;
  const lines = createExportableProjectCutlist(adapted);
  if (lines.length === 0) {
    throw new Error("Cabinet commercial fixture produced no cut-list lines.");
  }
  writeText("cabinet-commercial-cutlist.csv", csvFromProductionCutlist(lines));

  const live = buildLiveInteriorQuote(project, STAGE1_NOW, { priceBook: book });
  const snapshot = freezeLiveQuote(project, STAGE1_NOW, SNAPSHOT_ID, { priceBook: book });
  if (snapshot.cabinetCount < 1) {
    throw new Error("Cabinet commercial fixture froze with cabinetCount 0.");
  }
  writeText("cabinet-commercial-live-quote.csv", csvFromProjectQuote(live.quote));
  writeText("cabinet-commercial-frozen-quote.csv", csvFromFrozenSnapshot(snapshot));

  const ledgerProject = ledgerIdAfterAdapter(project);
  if (!ledgerProject.ledger.ok) throw new Error(ledgerProject.ledger.reason);
  let ledger = createEmptyLedger();
  const registered = registerCommercialDocFromFreeze(ledger, {
    projectId: project.id,
    snapshot,
    actor: "stage1-audit",
    at: STAGE1_NOW,
  });
  if (!registered.ok) throw new Error(registered.reason);
  ledger = registered.state;
  const booking = Math.max(1, Math.round(snapshot.sellTotal * 0.4));
  const balanceDue = snapshot.sellTotal - booking;
  const scheduled = setPaymentSchedule(ledger, {
    documentId: registered.document.id,
    instalments: [
      { id: "inst-booking", label: "Booking", amount: booking, dueDate: "2026-09-01" },
      { id: "inst-balance", label: "Balance", amount: balanceDue, dueDate: "2026-12-01" },
    ],
    stamp: { actor: "stage1-audit", at: STAGE1_NOW, reason: "stage1 sample schedule" },
  });
  ledger = scheduled.state;
  const paid = recordPayment(ledger, {
    documentId: registered.document.id,
    amount: booking,
    actor: "stage1-audit",
    note: "booking receipt",
    at: STAGE1_NOW,
  }, proGate);
  ledger = paid.state;
  const balances = computeDocumentBalances(ledger, registered.document.id, STAGE1_NOW);
  writeJson("cabinet-commercial-ledger.json", {
    asOf: STAGE1_NOW,
    note: "In-memory ledger. InteriorPaymentsPanel persists cabinet-studio-payment-ledger-v1.",
    ledgerProjectId: ledgerProject.ledger.projectId,
    document: registered.document,
    schedule: scheduled.schedule.instalments,
    payments: ledger.payments,
    balances,
    audit: ledger.audit,
  });

  const cabinets = (adapted.rooms ?? []).flatMap((room) => room.cabinets);
  writeJson("cabinet-commercial-summary.json", {
    fixture: "designedAndRated + placeSmokeMillwork + fillMissingCategoryRates",
    helpers: "src/domain/livingRoom/proposal/designToFreezeSmoke.helpers.ts",
    now: STAGE1_NOW,
    projectId: project.id,
    snapshotId: snapshot.id,
    ledgerProjectId: ledgerProject.ledger.projectId,
    cabinets: cabinets.map((cabinet) => ({
      id: cabinet.id,
      name: cabinet.name,
      type: cabinet.config.type,
      catalogItemId: cabinet.config.catalogItemId ?? null,
    })),
    cutlistLineCount: lines.length,
    cutlistKeys: lines.map((line) => line.key),
    sellTotal: snapshot.sellTotal,
    workshopTotal: snapshot.workshopTotal,
    cabinetCount: snapshot.cabinetCount,
    markupPercent: snapshot.markupPercent,
    taxPercent: snapshot.taxPercent,
    taxLabel: snapshot.taxLabel ?? null,
    currencyLabel: snapshot.currencyLabel ?? null,
    validUntil: snapshot.validUntil ?? null,
    detailLineCount: snapshot.detailLines?.length ?? 0,
    liveSellTotal: live.quote.sellTotal,
    liveMatchesFrozen: live.quote.sellTotal === snapshot.sellTotal,
    missingRate: live.missingRate,
    balances,
  });
}
