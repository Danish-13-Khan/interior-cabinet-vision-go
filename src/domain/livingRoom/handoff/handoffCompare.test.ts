import { describe, expect, it } from "vitest";
import { CABINET_PLANNING_EXTENSION } from "../../cabinetIdentity";
import type { InteriorProject, MaterialEntity } from "../../interiorProject";
import { createGoldenCabinetSceneProject } from "../goldenCabinetScene";
import { adaptHandoffProject, buildHandoffGate, diagnoseHandoffLoss } from ".";
import { compareAdaptedCabinet } from "./handoffConfigCompare";

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
  // Validation drops a slot whose material is unknown, so the authored finishes must exist.
  const authoredMaterials: MaterialEntity[] = Object.values(patch.materialSlots ?? {}).map((id) => ({
    id, name: id, kind: "wood", color: "#a67c52", roughness: 0.6, metalness: 0, opacity: 1,
  }));
  return {
    ...document,
    materials: [
      ...document.materials,
      ...authoredMaterials.filter((material) => !document.materials.some((item) => item.id === material.id)),
    ],
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
  it("carries authored materialSlots through the adapter instead of dropping them", () => {
    const slots = { carcass: "authored-carcass", fronts: "authored-fronts" };
    const document = patchGoldenSource(createGoldenCabinetSceneProject(), { materialSlots: slots });
    const adapted = adaptHandoffProject(document);
    const notes = diagnoseHandoffLoss(document);
    expect(adapted.project.cabinets.some((cabinet) => cabinet.materialSlots?.carcass === slots.carcass)).toBe(true);
    expect(notes.some((note) => note.path.includes("materialSlots") && note.code === "lossy-field")).toBe(false);
    expect(buildHandoffGate(document).items.some((item) => item.id === "lossy-golden")).toBe(false);
  });

  it("still reports materialSlots when Engineering holds different ones", () => {
    const document = patchGoldenSource(createGoldenCabinetSceneProject(), {
      materialSlots: { carcass: "authored-carcass" },
    });
    const adapted = adaptHandoffProject(document);
    const stripped = {
      ...adapted.project,
      cabinets: adapted.project.cabinets.map((cabinet) => ({ ...cabinet, materialSlots: undefined })),
      rooms: adapted.project.rooms?.map((room) => ({
        ...room,
        cabinets: room.cabinets.map((cabinet) => ({ ...cabinet, materialSlots: undefined })),
      })),
    };
    const target = document.objects.find((object) => object.kind === "cabinet")!;
    const cabinet = stripped.cabinets.find((item) => item.interiorObjectId === target.id || item.id === target.id)!;
    expect(compareAdaptedCabinet(target, cabinet, document).some((note) => note.path.includes("materialSlots"))).toBe(true);
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
