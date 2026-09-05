import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  formatCabinetInlineDims,
  formatPlanMark,
  readPlanMarksSettings,
  setPlanMarksSettings,
} from "./planMarks";
import { persistCabinetIdentityOnObject } from "../cabinetIdentity";

function seed(
  source: ReturnType<typeof createLivingRoomStarterProject>,
  patch: Record<string, unknown>,
) {
  return persistCabinetIdentityOnObject({
    ...source.objects[0]!,
    kind: "cabinet",
    category: "cabinet",
    materialSlots: {},
    parameters: {},
    extensions: {},
    dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    ...patch,
  } as never);
}

describe("planMarks", () => {
  it("formats base / wall / tall / filler / appliance marks", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const base = seed(source, {
      id: "b1",
      catalogItemId: "living:base-cabinet-900",
      dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    });
    const wall = seed(source, {
      id: "w1",
      catalogItemId: "living:wall-cabinet-900",
      dimensions: { widthMm: 900, heightMm: 720, depthMm: 350 },
    });
    const tall = seed(source, {
      id: "t1",
      catalogItemId: "living:tall-pantry-600",
      dimensions: { widthMm: 600, heightMm: 2100, depthMm: 560 },
    });
    const filler = {
      ...base,
      id: "f1",
      category: "filler",
      dimensions: { widthMm: 50, heightMm: 720, depthMm: 18 },
      extensions: { cabinetRunFiller: { runId: "run:1", side: "end" as const } },
    };
    const appliance = {
      ...base,
      id: "a1",
      catalogItemId: "kenney:kitchen-fridge",
      category: "kitchen-and-appliances",
      dimensions: { widthMm: 900, heightMm: 1800, depthMm: 700 },
      extensions: {},
    };
    expect(formatPlanMark(base)).toBe("B600");
    expect(formatPlanMark(wall)).toBe("W900");
    expect(formatPlanMark(tall)).toBe("T600");
    expect(formatPlanMark(filler)).toBe("F50");
    expect(formatPlanMark(appliance)).toBe("A900");
    expect(formatCabinetInlineDims(600, 560)).toBe("W 600 × D 560");
  });

  it("reads and writes planMarks project extension", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    expect(readPlanMarksSettings(source).enabled).toBe(false);
    const enabled = setPlanMarksSettings(source, { enabled: true, audience: "technical" });
    expect(readPlanMarksSettings(enabled)).toEqual({ enabled: true, audience: "technical" });
  });
});
