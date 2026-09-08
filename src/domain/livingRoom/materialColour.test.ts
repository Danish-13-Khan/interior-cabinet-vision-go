import { describe, expect, it } from "vitest";
import { loadInteriorProjectFile, serializeInteriorProjectFile } from "../interiorProject";
import { applyMaterialColour } from "./applyMaterialColour";
import { hexToRgb, normalizeHexColour, rgbToHex, resolveColourInput } from "./materialColourFormat";
import { shadeGroupForKind } from "./materialShadeGroups";
import { createLivingRoomStarterProject } from "./preset";
import { listRecentMaterialColours } from "./recentMaterialColours";

describe("material colour (M3)", () => {
  it("normalizes HEX and RGB inputs", () => {
    expect(normalizeHexColour("#ABC")).toBe("#aabbcc");
    expect(normalizeHexColour("a98262")).toBe("#a98262");
    expect(rgbToHex(169, 130, 98)).toBe("#a98262");
    expect(hexToRgb("#a98262")).toEqual({ r: 169, g: 130, b: 98 });
    expect(resolveColourInput({ hex: "#6a6e52" })).toBe("#6a6e52");
    expect(resolveColourInput({ r: 10, g: 20, b: 30 })).toBe("#0a141e");
  });

  it("exposes fixed shade groups per family", () => {
    expect(shadeGroupForKind("paint").length).toBeGreaterThanOrEqual(4);
    expect(shadeGroupForKind("wood").some((shade) => shade.color === "#a98262")).toBe(true);
  });

  it("applies a shade, records recent, and persists through save/reopen", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const wall = project.walls[0]!;
    const materialId = project.materials.find((material) => material.kind === "paint")?.id
      ?? project.materials[0]!.id;
    const withWall = applyMaterialColour(
      {
        ...project,
        walls: project.walls.map((item) =>
          item.id === wall.id ? { ...item, materialId } : item,
        ),
      },
      {
        materialId,
        color: "#6d7580",
        rebinds: [{ kind: "wall", wallId: wall.id }],
      },
    );
    const wallMaterialId = withWall.walls.find((item) => item.id === wall.id)?.materialId ?? materialId;
    expect(withWall.materials.find((item) => item.id === wallMaterialId)?.color).toBe("#6d7580");
    expect(listRecentMaterialColours(withWall)[0]?.color).toBe("#6d7580");

    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(withWall)).document;
    const reopenedWallMaterialId = reopened.walls.find((item) => item.id === wall.id)?.materialId;
    expect(reopened.materials.find((item) => item.id === reopenedWallMaterialId)?.color).toBe("#6d7580");
    expect(listRecentMaterialColours(reopened)[0]?.color).toBe("#6d7580");
  });

  it("custom colour on floor does not invent object-hide behaviour", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    const floorId = String(
      project.rooms[0]?.extensions?.floorMaterialId ?? project.materials[0]!.id,
    );
    const objectsBefore = project.objects;
    const next = applyMaterialColour(project, {
      materialId: floorId,
      color: "#112233",
      rebinds: [{ kind: "floor" }],
    });
    expect(next.objects).toEqual(objectsBefore);
    expect(listRecentMaterialColours(next)[0]?.color).toBe("#112233");
  });

  it("multi-select colour creates one unique clone shared by every rebind", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-06T00:00:00.000Z" });
    expect(project.walls.length).toBeGreaterThanOrEqual(3);
    const materialId = project.materials.find((material) => material.kind === "paint")?.id
      ?? project.materials[0]!.id;
    const targets = project.walls.slice(0, 3);
    const shared = {
      ...project,
      walls: project.walls.map((wall) =>
        targets.some((target) => target.id === wall.id) ? { ...wall, materialId } : wall,
      ),
    };
    // Extra ref so COW clones instead of in-place tint.
    const withExtraRef = {
      ...shared,
      walls: shared.walls.map((wall, index) =>
        index === 3 ? { ...wall, materialId } : wall,
      ),
    };

    const tinted = applyMaterialColour(withExtraRef, {
      materialId,
      color: "#445566",
      rebinds: targets.map((wall) => ({ kind: "wall" as const, wallId: wall.id })),
    });

    const materialIds = tinted.materials.map((material) => material.id);
    expect(new Set(materialIds).size).toBe(materialIds.length);

    const reboundIds = targets.map(
      (wall) => tinted.walls.find((item) => item.id === wall.id)?.materialId,
    );
    expect(reboundIds.every((id) => id && id !== materialId)).toBe(true);
    expect(new Set(reboundIds).size).toBe(1);
    const cloneId = reboundIds[0]!;
    expect(tinted.materials.find((material) => material.id === cloneId)?.color).toBe("#445566");
    expect(tinted.materials.find((material) => material.id === materialId)?.color).not.toBe("#445566");
  });
});
