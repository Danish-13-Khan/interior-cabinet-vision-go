import { describe, expect, it } from "vitest";
import { CABINET_PLANNING_EXTENSION } from "../../cabinetIdentity";
import type { InteriorProject } from "../../interiorProject";
import { createGoldenCabinetSceneProject } from "../goldenCabinetScene";
import { adaptHandoffProject, buildHandoffGate, diagnoseHandoffLoss } from ".";

function patchGoldenSource(
  document: InteriorProject,
  patch: {
    materialSlots?: Record<string, string>;
    planningWidth?: number;
    planningShelfCount?: number;
  },
): InteriorProject {
  const target = document.objects.find((object) => object.kind === "cabinet");
  if (!target) throw new Error("Expected a golden cabinet.");
  return {
    ...document,
    objects: document.objects.map((object) => {
      if (object.id !== target.id) return object;
      const planning = object.extensions?.[CABINET_PLANNING_EXTENSION];
      const record = planning && typeof planning === "object" && !Array.isArray(planning)
        ? planning as Record<string, unknown>
        : {};
      const config = record.config && typeof record.config === "object" && !Array.isArray(record.config)
        ? record.config as Record<string, unknown>
        : {};
      const dimensions = config.dimensions && typeof config.dimensions === "object"
        ? { ...(config.dimensions as Record<string, unknown>) }
        : {};
      const composition = config.composition && typeof config.composition === "object"
        ? { ...(config.composition as Record<string, unknown>) }
        : {};
      const shelves = composition.shelves && typeof composition.shelves === "object"
        ? { ...(composition.shelves as Record<string, unknown>) }
        : {};
      return {
        ...object,
        materialSlots: patch.materialSlots ?? object.materialSlots,
        extensions: {
          ...object.extensions,
          [CABINET_PLANNING_EXTENSION]: {
            ...record,
            config: {
              ...config,
              dimensions: patch.planningWidth != null
                ? { ...dimensions, width: patch.planningWidth }
                : config.dimensions,
              composition: patch.planningShelfCount != null
                ? { ...composition, shelves: { ...shelves, count: patch.planningShelfCount } }
                : config.composition,
            },
          },
        },
      };
    }),
  };
}

describe("golden handoff field compare", () => {
  it("reports materialSlots the adapter drops before Engineering", () => {
    const document = patchGoldenSource(createGoldenCabinetSceneProject(), {
      materialSlots: { carcass: "authored-carcass", fronts: "authored-fronts" },
    });
    const adapted = adaptHandoffProject(document);
    const notes = diagnoseHandoffLoss(document);
    expect(adapted.project.cabinets.some((cabinet) => "materialSlots" in cabinet)).toBe(false);
    expect(notes.some((note) => note.path.includes("materialSlots") && note.code === "lossy-field")).toBe(true);
    expect(buildHandoffGate(document).items.some((item) => item.id === "lossy-golden")).toBe(true);
  });

  it("reports planning config the adapter overwrites from object fields", () => {
    const document = patchGoldenSource(createGoldenCabinetSceneProject(), {
      planningWidth: 777,
      planningShelfCount: 9,
    });
    const notes = diagnoseHandoffLoss(document).filter((note) => note.code === "lossy-field");
    expect(notes.some((note) => note.path.includes("planning.dimensions.width"))).toBe(true);
    expect(notes.some((note) => note.path.includes("composition"))).toBe(true);
    expect(buildHandoffGate(document).items.some((item) => item.id === "lossy-golden")).toBe(true);
  });
});
