import { describe, expect, it } from "vitest";
import { createProjectReport } from "../projectReport";
import {
  freezeCabinetQuoteAndSyncLedger,
  prepareCabinetFreezeForLedger,
} from "../../hooks/freezeQuoteAndSyncLedger";
import { outstandingForProject } from "./outstanding";
import { readPaymentLedger } from "./store";
import {
  ensureCabinetLedgerProjectId,
  FORBIDDEN_CABINET_LEDGER_FALLBACK,
  MISSING_LEDGER_PROJECT_ID,
} from "./cabinetLedgerProjectId";
import {
  makeCabinetProject,
  memoryStorage,
  testRoom,
} from "./cabinetFreezeTestHelpers";

describe("ensureCabinetLedgerProjectId", () => {
  it("assigns and persists ledgerProjectId; never uses cabinet-project or projectNumber", () => {
    const project = makeCabinetProject({ projectNumber: "JOB-EDITABLE" });
    const ensured = ensureCabinetLedgerProjectId(project, () => "cproj-stable-1");
    expect(ensured.ok).toBe(true);
    if (!ensured.ok) return;
    expect(ensured.projectId).toBe("cproj-stable-1");
    expect(ensured.project.ledgerProjectId).toBe("cproj-stable-1");
    expect(ensured.projectId).not.toBe("JOB-EDITABLE");
    expect(ensured.projectId).not.toBe(FORBIDDEN_CABINET_LEDGER_FALLBACK);
  });

  it("prefers interiorDocument.id and mirrors it onto ledgerProjectId", () => {
    const project = makeCabinetProject({
      projectNumber: "JOB-9",
      interiorId: "interior-abc",
    });
    const ensured = ensureCabinetLedgerProjectId(project);
    expect(ensured.ok).toBe(true);
    if (!ensured.ok) return;
    expect(ensured.projectId).toBe("interior-abc");
    expect(ensured.project.ledgerProjectId).toBe("interior-abc");
  });

  it("refuses when createId yields the forbidden fallback", () => {
    const project = makeCabinetProject();
    const refused = ensureCabinetLedgerProjectId(
      project,
      () => FORBIDDEN_CABINET_LEDGER_FALLBACK,
    );
    expect(refused).toMatchObject({
      ok: false,
      reason: MISSING_LEDGER_PROJECT_ID,
    });
  });

  it("reuses existing ledgerProjectId across freezes", () => {
    const project = makeCabinetProject({ ledgerProjectId: "cproj-kept" });
    const first = ensureCabinetLedgerProjectId(project);
    const second = ensureCabinetLedgerProjectId(first.ok ? first.project : project);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.projectId).toBe("cproj-kept");
    expect(second.projectId).toBe("cproj-kept");
  });
});

describe("cabinet freeze: distinct threads without job numbers", () => {
  it("two projects get distinct ledger threads; freezing B does not supersede A", () => {
    const store = memoryStorage();
    const a = makeCabinetProject();
    const b = makeCabinetProject();
    const reportA = createProjectReport(a, testRoom);
    const reportB = createProjectReport(b, testRoom);

    const frozenA = freezeCabinetQuoteAndSyncLedger({
      project: a,
      quote: reportA.quote,
      priceBook: null,
      storage: store,
    });
    const frozenB = freezeCabinetQuoteAndSyncLedger({
      project: b,
      quote: reportB.quote,
      priceBook: null,
      storage: store,
    });

    expect(frozenA.ledgerStatus).toBeUndefined();
    expect(frozenB.ledgerStatus).toBeUndefined();
    expect(frozenA.projectId).toBeTruthy();
    expect(frozenB.projectId).toBeTruthy();
    expect(frozenA.projectId).not.toBe(frozenB.projectId);
    expect(frozenA.project.ledgerProjectId).toBe(frozenA.projectId);
    expect(frozenB.project.ledgerProjectId).toBe(frozenB.projectId);
    expect(frozenA.projectId).not.toBe(FORBIDDEN_CABINET_LEDGER_FALLBACK);
    expect(frozenB.projectId).not.toBe(FORBIDDEN_CABINET_LEDGER_FALLBACK);

    const ledger = readPaymentLedger(store);
    expect(ledger.documents).toHaveLength(2);
    expect(ledger.documents.every((d) => !d.superseded)).toBe(true);
    expect(ledger.documents.map((d) => d.projectId).sort()).toEqual(
      [frozenA.projectId!, frozenB.projectId!].sort(),
    );
    expect(outstandingForProject(ledger, frozenA.projectId!)?.outstanding).toBe(
      reportA.quote.sellTotal,
    );
    expect(outstandingForProject(ledger, frozenB.projectId!)?.outstanding).toBe(
      reportB.quote.sellTotal,
    );
    expect(JSON.stringify(ledger)).not.toContain(FORBIDDEN_CABINET_LEDGER_FALLBACK);
  });

  it("prepareCabinetFreezeForLedger does not write ledger; no cabinet-project id", () => {
    const project = makeCabinetProject({ projectNumber: "" });
    const prepared = prepareCabinetFreezeForLedger({
      project,
      quote: createProjectReport(project, testRoom).quote,
      priceBook: null,
    });
    expect(prepared.ledgerRefuseReason).toBeUndefined();
    expect(prepared.projectId).toBeTruthy();
    expect(prepared.projectId).not.toBe(FORBIDDEN_CABINET_LEDGER_FALLBACK);
    expect(prepared.project.ledgerProjectId).toBe(prepared.projectId);
    expect(readPaymentLedger(memoryStorage()).documents).toHaveLength(0);
  });
});
