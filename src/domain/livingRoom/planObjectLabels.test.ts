import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject, GOLDEN_RUN_OBJECT_IDS } from "./goldenRun";
import { resolvePlanObjectLabelModes } from "./planObjectLabels";

describe("plan object label declutter (CAB-046)", () => {
  it("hides non-selected labels on a packed golden kitchen run", () => {
    const project = createGoldenCabinetRunProject();
    const cabinets = project.objects.filter((object) => object.kind === "cabinet");
    expect(cabinets.length).toBeGreaterThan(3);

    const noneSelected = resolvePlanObjectLabelModes(cabinets, []);
    const shown = [...noneSelected.entries()].filter(([, mode]) => mode !== "hidden");
    // Without selection, dense run labels must not all paint on top of each other.
    expect(shown.length).toBeLessThanOrEqual(2);

    const selectedId = GOLDEN_RUN_OBJECT_IDS.baseA;
    const withSelection = resolvePlanObjectLabelModes(cabinets, [selectedId]);
    expect(withSelection.get(selectedId)).toMatch(/^(full|name)$/);
    const othersShown = [...withSelection.entries()]
      .filter(([id, mode]) => id !== selectedId && mode !== "hidden");
    expect(othersShown.length).toBeLessThanOrEqual(1);
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
});
