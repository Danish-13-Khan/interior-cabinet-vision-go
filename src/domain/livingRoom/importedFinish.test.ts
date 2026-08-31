import { describe, expect, it } from "vitest";
import { createEmptyInteriorProject } from "../interiorProject";
import { compileLivingRoomScene } from "./sceneCompiler";
import { addImportedFinish, finishMapUrl, setFinishUv } from "./importedFinish";

describe("imported finish", () => {
  it("stores a project-owned texture map and compiles it onto the material", () => {
    const project = createEmptyInteriorProject({ id: "finish-test", now: "2026-08-31T00:00:00.000Z" });
    const added = addImportedFinish(project, {
      name: "Oak plank.png",
      dataUrl: "data:image/png;base64,aaaa",
      uvScaleMm: 800,
    });
    expect(added.materialId).toBe("finish-import-1");
    const material = added.project.materials.find((item) => item.id === added.materialId)!;
    expect(material.name).toBe("Oak plank");
    expect(finishMapUrl(material)).toBe("data:image/png;base64,aaaa");
    const rotated = setFinishUv(added.project, added.materialId, { uvRotationDeg: 90, uvScaleMm: 1200 });
    const scene = compileLivingRoomScene(rotated);
    const compiled = scene.materials.find((item) => item.id === added.materialId)!;
    expect(compiled.textureMapUrl).toBe("data:image/png;base64,aaaa");
    expect(compiled.uvScaleMm).toBe(1200);
    expect(compiled.uvRotationDeg).toBe(90);
  });
});
