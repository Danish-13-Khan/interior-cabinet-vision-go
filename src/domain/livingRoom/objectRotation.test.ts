import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from ".";
import {
  formatRotationDeg,
  isOffQuarterTurn,
  normalizeRotationDeg,
  rotatesInQuarterTurns,
  rotationStepFor,
} from "./objectRotation";

const NOW = "2026-10-05T12:00:00.000Z";

function fixtures() {
  const project = createLivingRoomStarterProject({ now: NOW });
  const sofa = project.objects.find((object) => object.category === "sofa")!;
  const cabinet = { ...sofa, id: "cab-1", kind: "cabinet" as const, category: "base" };
  return { sofa, cabinet };
}

describe("object rotation rules", () => {
  it("steps cabinets 90° and other objects 15°", () => {
    const { sofa, cabinet } = fixtures();
    expect(rotatesInQuarterTurns(sofa)).toBe(false);
    expect(rotatesInQuarterTurns(cabinet)).toBe(true);
    expect(rotationStepFor(sofa)).toBe(15);
    expect(rotationStepFor(cabinet)).toBe(90);
  });

  it("normalises into [0, 360)", () => {
    expect(normalizeRotationDeg(-90)).toBe(270);
    expect(normalizeRotationDeg(360)).toBe(0);
    expect(normalizeRotationDeg(725)).toBe(5);
    expect(normalizeRotationDeg(Number.NaN)).toBe(0);
  });

  it("formats wall-normal angles with one decimal instead of a 45° bucket", () => {
    expect(formatRotationDeg(33.6900675)).toBe("33.7");
    expect(formatRotationDeg(-15)).toBe("345");
    expect(formatRotationDeg(90)).toBe("90");
    expect(formatRotationDeg(359.97)).toBe("0");
  });

  it("flags cabinets angled off a quarter turn", () => {
    const { cabinet } = fixtures();
    const at = (y: number) => ({ ...cabinet, rotation: { ...cabinet.rotation, y } });
    expect(isOffQuarterTurn(at(90))).toBe(false);
    expect(isOffQuarterTurn(at(359.8))).toBe(false);
    expect(isOffQuarterTurn(at(33.7))).toBe(true);
  });
});
