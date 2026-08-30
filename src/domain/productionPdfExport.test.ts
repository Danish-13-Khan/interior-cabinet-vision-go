import { describe, expect, it } from "vitest";
import { defaultCabinetProject, getDefaultCabinetConfig } from "./cabinetDimensions";
import { createGoldenCabinetInstance } from "./cabinetIdentity";
import { DEFAULT_ROOM } from "./roomModel";
import { exportProjectPdf } from "./pdfExport";
import { ProductionIdentityBlockedError } from "./productionOutputs";
import {
  runCabinetsPdfExport,
  runInteriorsProductionPdfExport,
} from "./productionPdfExport";

function blockedProject() {
  const cabinet = {
    ...createGoldenCabinetInstance("frameless-standard-base"),
    config: {
      ...getDefaultCabinetConfig("base"),
      familyId: "not-a-real-family",
    },
  };
  return { ...defaultCabinetProject, cabinets: [cabinet] };
}

function trackingIo() {
  const prompts: string[] = [];
  const writes: string[] = [];
  const generates: string[] = [];
  return {
    prompts,
    writes,
    generates,
    io: {
      promptPath: async () => {
        prompts.push("prompted");
        return "blocked.pdf";
      },
      writePdf: async (path: string) => {
        writes.push(path);
      },
      generatePdf: async () => {
        generates.push("generated");
        return new Blob(["pdf"]);
      },
    },
  };
}

describe("production packet PDF export gate", () => {
  it("does not prompt or write from the Cabinets PDF entry point when blocked", async () => {
    const project = blockedProject();
    const tracked = trackingIo();
    const result = await runCabinetsPdfExport(project, tracked.io);
    expect(result.prompted).toBe(false);
    expect(result.wrote).toBe(false);
    expect(tracked.prompts).toEqual([]);
    expect(tracked.writes).toEqual([]);
    expect(tracked.generates).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
    expect(result.status).toContain("not-a-real-family");
  });

  it("does not prompt or write from the Interiors Production Packet PDF when blocked", async () => {
    const project = blockedProject();
    const tracked = trackingIo();
    const result = await runInteriorsProductionPdfExport(
      project,
      tracked.io,
      "Production packet exported (0 cut parts).",
    );
    expect(result.prompted).toBe(false);
    expect(result.wrote).toBe(false);
    expect(tracked.prompts).toEqual([]);
    expect(tracked.writes).toEqual([]);
    expect(tracked.generates).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
  });

  it("throws at the exportProjectPdf boundary when identity is blocked", async () => {
    await expect(
      exportProjectPdf(blockedProject(), null, "Blocked", DEFAULT_ROOM),
    ).rejects.toBeInstanceOf(ProductionIdentityBlockedError);
  });
});
