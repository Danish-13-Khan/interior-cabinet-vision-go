import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../preset";
import { buildLivingRoomMillworkSchedule } from "./buildSchedule";
import { exportMillworkSchedulePdf } from "./schedulePdf";

const NOW = "2026-08-15T10:30:00.000Z";

async function pdfText(blob: Blob): Promise<string> {
  return new TextDecoder("latin1").decode(await blob.arrayBuffer());
}

describe("exportMillworkSchedulePdf", () => {
  it("returns a non-empty PDF with the v1 workshop header", async () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const schedule = buildLivingRoomMillworkSchedule(project, NOW);
    const blob = exportMillworkSchedulePdf(schedule);
    expect(blob.size).toBeGreaterThan(500);
    expect(blob.type).toBe("application/pdf");
    const raw = await pdfText(blob);
    expect(raw).toContain("Millwork Schedule v1");
    expect(raw).toContain("WORKSHOP");
    expect(raw).toContain(String(schedule.lines[0]!.widthMm));
  });

  it("exports a valid empty schedule table", async () => {
    const project = createLivingRoomStarterProject({ now: NOW });
    const stripped = { ...project, objects: project.objects.filter((object) => object.category === "sofa") };
    const schedule = buildLivingRoomMillworkSchedule(stripped, NOW);
    const blob = exportMillworkSchedulePdf(schedule);
    const raw = await pdfText(blob);
    expect(raw).toContain("No millwork objects");
  });
});
