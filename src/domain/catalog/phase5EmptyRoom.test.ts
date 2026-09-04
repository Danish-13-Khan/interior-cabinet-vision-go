import { describe, expect, it } from "vitest";
import {
  EMPTY_ROOM_CATALOG_TEMPLATE_ID,
  instantiateEmptyRoomCatalogTemplate,
  lookupBuiltInCatalogTemplate,
  templateModelAssetIds,
  validateCatalogManifest,
} from ".";
import { serializeInteriorProjectFile, loadInteriorProjectFile } from "../interiorProject";
import { validateInteriorProject } from "../interiorProject";
import manifest from "../../../public/catalog/builtin-catalog.v1.json";
import type { CatalogManifest } from "./types";

const catalog = manifest as CatalogManifest;
const NOW = "2026-09-04T12:00:00.000Z";

describe("Phase 5 Empty Room template", () => {
  it("registers an empty shell template with door/window-ready thumbnail and no furniture", () => {
    expect(catalog.catalogVersion).toBe("2026.09.7");
    const template = lookupBuiltInCatalogTemplate(EMPTY_ROOM_CATALOG_TEMPLATE_ID)!;
    expect(template.name).toBe("Empty Room");
    expect(template.category).toBe("empty");
    expect(template.objects).toHaveLength(0);
    expect(template.room).toEqual({ widthMm: 5200, depthMm: 4200, heightMm: 2700 });
    const thumb = catalog.files.find((file) => file.id === template.images.thumbnailId);
    expect(thumb?.kind).toBe("image");
    expect(thumb?.objectKey).toBe("catalog/templates/empty-room-v1.png");
    expect(validateCatalogManifest(catalog).filter((issue) => issue.level === "error")).toEqual([]);
    expect(templateModelAssetIds(EMPTY_ROOM_CATALOG_TEMPLATE_ID)).toHaveLength(0);
  });

  it("instantiates a custom room shell with one door, one window, and zero objects", () => {
    const project = instantiateEmptyRoomCatalogTemplate({
      projectId: "empty-phase5",
      projectName: "Phase 5 Empty Room",
      now: NOW,
    });
    expect(project.extensions?.catalogTemplateId).toBe(EMPTY_ROOM_CATALOG_TEMPLATE_ID);
    expect(project.extensions?.catalogTemplateVersion).toBe(1);
    expect(project.objects).toHaveLength(0);
    expect(project.rooms).toHaveLength(1);
    expect(project.rooms[0]?.roomType).toBe("custom");
    expect(project.rooms[0]?.name).toBe("Empty Room");
    expect(project.rooms[0]?.dimensions).toEqual({
      widthMm: 5200,
      heightMm: 2700,
      depthMm: 4200,
    });
    expect(project.walls).toHaveLength(4);
    expect(project.openings).toHaveLength(2);
    expect(project.openings.map((opening) => opening.kind).sort()).toEqual(["door", "window"]);
    expect(project.materials.length).toBeGreaterThan(0);
    expect(validateInteriorProject(project).issues.filter((issue) => issue.severity === "error")).toEqual([]);

    const second = instantiateEmptyRoomCatalogTemplate({
      projectId: "empty-phase5-b",
      projectName: "Second Empty Room",
      now: NOW,
    });
    expect(second.rooms[0]!.id).not.toBe(project.rooms[0]!.id);
    expect(second.openings.map((opening) => opening.id).sort()).not.toEqual(
      project.openings.map((opening) => opening.id).sort(),
    );
  });

  it("preserves empty-shell catalog identity across serialize/reopen", () => {
    const project = instantiateEmptyRoomCatalogTemplate({
      projectId: "empty-roundtrip",
      projectName: "Roundtrip Empty Room",
      now: NOW,
    });
    const json = serializeInteriorProjectFile(project);
    const reopened = loadInteriorProjectFile(json).document;
    expect(reopened.extensions?.catalogTemplateId).toBe(EMPTY_ROOM_CATALOG_TEMPLATE_ID);
    expect(reopened.objects).toHaveLength(0);
    expect(reopened.openings).toHaveLength(2);
    expect(reopened.rooms[0]?.roomType).toBe("custom");
  });
});
