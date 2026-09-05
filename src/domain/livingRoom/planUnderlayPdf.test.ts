import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeCropRect } from "./planUnderlayPdfCrop";
import { createPlanUnderlayImportCancelGate, isPdfFile } from "./planUnderlayImport";

describe("normalizeCropRect", () => {
  it("returns null for missing or empty input", () => {
    expect(normalizeCropRect(null, 100, 80)).toBeNull();
    expect(normalizeCropRect(undefined, 100, 80)).toBeNull();
    expect(normalizeCropRect({ x: 10, y: 10, width: 0, height: 20 }, 100, 80)).toBeNull();
    expect(normalizeCropRect({ x: 10, y: 10, width: 20, height: 0 }, 100, 80)).toBeNull();
  });

  it("clamps to page bounds", () => {
    expect(normalizeCropRect({ x: -20, y: -10, width: 50, height: 40 }, 100, 80)).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    });
    expect(normalizeCropRect({ x: 90, y: 70, width: 40, height: 40 }, 100, 80)).toEqual({
      x: 90,
      y: 70,
      width: 10,
      height: 10,
    });
  });

  it("normalizes inverted drag (negative width/height)", () => {
    expect(normalizeCropRect({ x: 80, y: 60, width: -40, height: -30 }, 100, 80)).toEqual({
      x: 40,
      y: 30,
      width: 40,
      height: 30,
    });
  });

  it("rejects non-finite values and zero page size", () => {
    expect(normalizeCropRect({ x: Number.NaN, y: 0, width: 10, height: 10 }, 100, 80)).toBeNull();
    expect(normalizeCropRect({ x: 0, y: 0, width: 10, height: 10 }, 0, 80)).toBeNull();
  });
});

describe("isPdfFile", () => {
  it("detects PDF by MIME and extension", () => {
    expect(isPdfFile(new File([], "plan.pdf", { type: "application/pdf" }))).toBe(true);
    expect(isPdfFile(new File([], "PLAN.PDF", { type: "" }))).toBe(true);
    expect(isPdfFile(new File([], "plan.png", { type: "image/png" }))).toBe(false);
  });
});

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => {
  const destroy = vi.fn(async () => undefined);
  const getDocument = vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn(),
      destroy,
    }),
  }));
  return {
    getDocument,
    GlobalWorkerOptions: { workerSrc: "" },
  };
});

describe("getPdfPageCount (mocked pdfjs)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns document page count", async () => {
    const { getPdfPageCount } = await import("./planUnderlayPdf");
    await expect(getPdfPageCount(new Uint8Array([1, 2, 3]))).resolves.toBe(3);
  });
});

describe("createPlanUnderlayImportCancelGate", () => {
  it("ignores confirm after cancel (Escape race)", () => {
    const gate = createPlanUnderlayImportCancelGate();
    const gen = gate.beginConfirm();
    expect(gen).toBe(1);
    expect(gate.isCurrent(gen!)).toBe(true);
    gate.cancel();
    expect(gate.cancelled).toBe(true);
    expect(gate.isCurrent(gen!)).toBe(false);
    expect(gate.beginConfirm()).toBeNull();
  });

  it("supersedes an older confirm generation", () => {
    const gate = createPlanUnderlayImportCancelGate();
    const first = gate.beginConfirm();
    const second = gate.beginConfirm();
    expect(gate.isCurrent(first!)).toBe(false);
    expect(gate.isCurrent(second!)).toBe(true);
  });
});
