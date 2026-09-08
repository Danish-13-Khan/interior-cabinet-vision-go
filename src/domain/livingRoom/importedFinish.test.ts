import { describe, expect, it } from "vitest";
import {
  createEmptyInteriorProject,
  loadInteriorProjectFile,
  MAX_INTERIOR_PROJECT_FILE_BYTES,
  serializeInteriorProjectFile,
} from "../interiorProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import {
  addImportedFinish,
  finishMapUrl,
  mapPayloadExceedsProjectLimit,
  MAX_FINISH_BYTES,
  normalizeFinishUv,
  readImageAsDataUrl,
  setFinishUv,
  stageFinishImportFile,
  validateFinishImageFile,
} from "./index";

const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("imported finish (M4)", () => {
  it("stores a project-owned texture map and compiles UV including offset", () => {
    const project = createEmptyInteriorProject({ id: "finish-test", now: "2026-08-31T00:00:00.000Z" });
    const added = addImportedFinish(project, {
      name: "Oak plank.png",
      dataUrl: TINY_PNG,
      uvScaleMm: 800,
      uvOffsetU: 0.25,
      uvOffsetV: 0.1,
    });
    expect(added.materialId).toBe("finish-import-1");
    const material = added.project.materials.find((item) => item.id === added.materialId)!;
    expect(material.name).toBe("Oak plank");
    expect(finishMapUrl(material)).toBe(TINY_PNG);
    const rotated = setFinishUv(added.project, added.materialId, {
      uvRotationDeg: 90,
      uvScaleMm: 1200,
      uvOffsetU: 0.4,
    });
    const scene = compileLivingRoomScene(rotated);
    const compiled = scene.materials.find((item) => item.id === added.materialId)!;
    expect(compiled.textureMapUrl).toBe(TINY_PNG);
    expect(compiled.uvScaleMm).toBe(1200);
    expect(compiled.uvRotationDeg).toBe(90);
    expect(compiled.uvOffsetU).toBe(0.4);
    expect(compiled.uvOffsetV).toBe(0.1);
  });

  it("persists imported finish UV through save and reopen", () => {
    const project = createEmptyInteriorProject({ id: "finish-roundtrip", now: "2026-08-31T00:00:00.000Z" });
    const added = addImportedFinish(project, {
      name: "Tile.webp",
      dataUrl: TINY_PNG,
      uvScaleMm: 600,
      uvRotationDeg: 45,
      uvOffsetU: 0.2,
      uvOffsetV: 0.3,
    });
    const reopened = loadInteriorProjectFile(serializeInteriorProjectFile(added.project)).document;
    const material = reopened.materials.find((item) => item.id === added.materialId)!;
    expect(finishMapUrl(material)).toBe(TINY_PNG);
    expect(material.extensions?.uvScaleMm).toBe(600);
    expect(material.extensions?.uvRotationDeg).toBe(45);
    expect(material.extensions?.uvOffsetU).toBe(0.2);
    expect(material.extensions?.uvOffsetV).toBe(0.3);
  });

  it("rejects unsupported MIME types with a clear warning", async () => {
    expect(validateFinishImageFile(
      new File([new Uint8Array(8)], "x.gif", { type: "image/gif" }),
      MAX_FINISH_BYTES,
    )).toMatch(/Unsupported file type/);
    const file = new File([new Uint8Array(8)], "x.gif", { type: "image/gif" });
    await expect(readImageAsDataUrl(file)).rejects.toThrow(/Unsupported file type/);
  });

  it("rejects images larger than the per-texture cap", async () => {
    const file = new File([new Uint8Array(MAX_FINISH_BYTES + 1)], "huge.png", { type: "image/png" });
    await expect(readImageAsDataUrl(file)).rejects.toThrow("2 MB");
  });

  it("rejects a finish that would make the saved project unopenable", () => {
    expect(mapPayloadExceedsProjectLimit(MAX_INTERIOR_PROJECT_FILE_BYTES, 16)).toBe(true);
    expect(mapPayloadExceedsProjectLimit(0, 100)).toBe(false);
  });

  it("normalizes UV scale and rotation on initial import", () => {
    const project = createEmptyInteriorProject({ id: "finish-clamp", now: "2026-08-31T00:00:00.000Z" });
    const added = addImportedFinish(project, {
      name: "Bad UV.png",
      dataUrl: TINY_PNG,
      uvScaleMm: 0,
      uvRotationDeg: -90,
    });
    const material = added.project.materials.find((item) => item.id === added.materialId)!;
    expect(material.extensions?.uvScaleMm).toBe(120);
    expect(material.extensions?.uvRotationDeg).toBe(270);
    expect(normalizeFinishUv({ uvScaleMm: 0, uvRotationDeg: 450 })).toMatchObject({
      uvScaleMm: 120,
      uvRotationDeg: 90,
    });
  });

  it("stages a finish draft for preview before apply", async () => {
    const bytes = Uint8Array.from(atob(TINY_PNG.split(",")[1]!), (char) => char.charCodeAt(0));
    const file = new File([bytes], "preview.png", { type: "image/png" });
    const draft = await stageFinishImportFile(file);
    expect(draft.fileName).toBe("preview.png");
    expect(draft.dataUrl.startsWith("data:image/png")).toBe(true);
    expect(draft.uvScaleMm).toBe(1000);
    expect(draft.uvOffsetU).toBe(0);
  });
});
