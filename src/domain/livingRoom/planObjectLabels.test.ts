import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject, GOLDEN_RUN_OBJECT_IDS } from "./goldenRun";
import { resolvePlanObjectLabelModes } from "./planObjectLabels";

describe("plan object label declutter (CAB-046)", () => {
  it("prefers name labels on a packed golden kitchen run instead of blanking the run", () => {
    const project = createGoldenCabinetRunProject();
    const cabinets = project.objects.filter((object) => object.kind === "cabinet");
    expect(cabinets.length).toBeGreaterThan(3);

    const noneSelected = resolvePlanObjectLabelModes(cabinets, []);
    const shown = [...noneSelected.entries()].filter(([, mode]) => mode !== "hidden");
    const named = shown.filter(([, mode]) => mode === "name");
    // Dense run should declutter (no full-label paint storm) but not go blank.
    expect(shown.length).toBeGreaterThan(0);
    expect(named.length).toBeGreaterThan(0);
    expect(shown.every(([, mode]) => mode === "name" || mode === "full")).toBe(true);
    // Still decluttered: not every cabinet keeps a full label.
    const fullCount = [...noneSelected.values()].filter((mode) => mode === "full").length;
    expect(fullCount).toBeLessThan(cabinets.length);

    const selectedId = GOLDEN_RUN_OBJECT_IDS.baseA;
    const withSelection = resolvePlanObjectLabelModes(cabinets, [selectedId]);
    expect(withSelection.get(selectedId)).toMatch(/^(full|name)$/);
    const othersFull = [...withSelection.entries()]
      .filter(([id, mode]) => id !== selectedId && mode === "full");
    expect(othersFull.length).toBe(0);
  });

  it("keeps full labels when objects are isolated", () => {
    const modes = resolvePlanObjectLabelModes([
      {
        id: "a",
        name: "Sofa",
        category: "sofa",
        kind: "furniture",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { widthMm: 2200, heightMm: 800, depthMm: 900 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        id: "b",
        name: "Plant",
        category: "plant",
        kind: "decor",
        position: { x: 4000, y: 0, z: 3000 },
        dimensions: { widthMm: 400, heightMm: 900, depthMm: 400 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ], []);
    expect(modes.get("a")).toBe("full");
    expect(modes.get("b")).toBe("name");
  });

  it("keeps non-selected fillers hidden while neighboring cabinets stay labeled", () => {
    const modes = resolvePlanObjectLabelModes([
      {
        id: "cab",
        name: "Base",
        category: "base",
        kind: "cabinet",
        position: { x: 0, y: 0, z: 0 },
        dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        id: "fill",
        name: "Filler",
        category: "filler",
        kind: "cabinet",
        position: { x: 320, y: 0, z: 0 },
        dimensions: { widthMm: 50, heightMm: 720, depthMm: 560 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ], []);
    expect(modes.get("fill")).toBe("hidden");
    // Filler is excluded from the "nearly stacked" hide path for real cabinets.
    expect(modes.get("cab")).toMatch(/^(full|name)$/);
  });
});
