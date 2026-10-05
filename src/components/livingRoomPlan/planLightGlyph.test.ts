import { describe, expect, it } from "vitest";
import type { LightEntity } from "../../domain/interiorProject";
import { planLightGlyph } from "./planLightGlyph";

function light(over: Partial<LightEntity> & { fixtureKind: string; widthMm: number }): LightEntity {
  return {
    id: "room-fixture-1",
    roomId: "room",
    name: "Light",
    kind: over.kind ?? "area",
    enabled: true,
    color: "#ffffff",
    intensity: 3,
    position: over.position ?? { x: 1000, y: 2400, z: 2000 },
    rotation: over.rotation ?? { x: 0, y: 0, z: 0 },
    parameters: { fixtureKind: over.fixtureKind, widthMm: over.widthMm, heightMm: over.parameters?.heightMm ?? 20 },
  };
}

describe("planLightGlyph", () => {
  it("lays an area strip along local +X", () => {
    expect(planLightGlyph(light({ fixtureKind: "cove", widthMm: 1000 }))).toEqual({
      shape: "line", x1: 500, z1: 2000, x2: 1500, z2: 2000,
    });
  });

  it("yaws a strip so local +X is (cos yaw, −sin yaw)", () => {
    const glyph = planLightGlyph(light({
      fixtureKind: "rope", widthMm: 1000, rotation: { x: 0, y: 90, z: 0 },
    }));
    expect(glyph.shape).toBe("line");
    if (glyph.shape !== "line") return;
    expect(glyph.x1).toBeCloseTo(1000);
    expect(glyph.z1).toBeCloseTo(2500);
    expect(glyph.x2).toBeCloseTo(1000);
    expect(glyph.z2).toBeCloseTo(1500);
  });

  it("draws a panel as a rectangle and a spot as a circle", () => {
    const panel = planLightGlyph(light({
      kind: "area", fixtureKind: "panel", widthMm: 600,
      parameters: { heightMm: 400 },
    }));
    expect(panel.shape).toBe("rect");
    if (panel.shape !== "rect") return;
    expect(panel.points.split(" ")).toHaveLength(4);
    expect(planLightGlyph(light({ kind: "spot", fixtureKind: "cob", widthMm: 90 })).shape).toBe("circle");
  });
});
