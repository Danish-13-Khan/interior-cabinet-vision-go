import { describe, expect, it } from "vitest";
import type { MaterialKind } from "../interiorProject";
import { CATALOG_SEED_MATERIALS } from "../catalog/materials/seedMaterials";
import { createLivingRoomStarterProject } from "./preset";
import { applySurfaceFinish, getSurfaceFinish, SURFACE_FINISHES } from "./surfaceFinishes";

const REQUIRED_KINDS: MaterialKind[] = [
  "laminate", "acrylic", "wood", "paint", "wallpaper", "stone", "tile", "fabric", "metal",
];

describe("surface finish library", () => {
  it("offers a finish for every family the costing model prices", () => {
    for (const kind of REQUIRED_KINDS) {
      expect(SURFACE_FINISHES.some((finish) => finish.kind === kind), `no finish of kind ${kind}`).toBe(true);
    }
  });

  it("separates acrylic from laminate rather than labelling them together", () => {
    const gloss = getSurfaceFinish("gloss-laminate")!;
    const acrylic = getSurfaceFinish("acrylic-gloss")!;
    expect(gloss.label).not.toContain("acrylic");
    expect(acrylic.kind).toBe("acrylic");
    expect(acrylic.roughness).toBeLessThan(gloss.roughness);
  });

  it("separates tile from stone", () => {
    expect(getSurfaceFinish("glazed-tile")!.kind).toBe("tile");
    expect(getSurfaceFinish("honed-stone")!.kind).toBe("stone");
  });

  it("uses unique ids", () => {
    expect(new Set(SURFACE_FINISHES.map((finish) => finish.id)).size).toBe(SURFACE_FINISHES.length);
  });
});

describe("applySurfaceFinish", () => {
  it("writes the finish kind and response onto the material", () => {
    const project = createLivingRoomStarterProject();
    const target = project.materials[0];
    const next = applySurfaceFinish(project, target.id, "acrylic-gloss");
    const material = next.materials.find((entry) => entry.id === target.id)!;
    expect(material.kind).toBe("acrylic");
    expect(material.extensions?.surfaceFinish).toBe("acrylic-gloss");
  });

  it("ignores an unknown finish id", () => {
    const project = createLivingRoomStarterProject();
    expect(applySurfaceFinish(project, project.materials[0].id, "nope")).toBe(project);
  });
});

describe("seed material library", () => {
  it("ships selectable wallpaper, acrylic, tile and paint materials", () => {
    for (const kind of ["wallpaper", "acrylic", "tile", "paint"]) {
      const matches = CATALOG_SEED_MATERIALS.filter((material) => material.kind === kind);
      expect(matches.length, `no seed material of kind ${kind}`).toBeGreaterThan(0);
      expect(matches.every((material) => material.visibleInPicker)).toBe(true);
    }
  });

  it("keeps seed material ids unique", () => {
    const ids = CATALOG_SEED_MATERIALS.map((material) => material.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
